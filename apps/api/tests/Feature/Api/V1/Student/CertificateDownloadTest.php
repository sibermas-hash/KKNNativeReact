<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Student\CertificateController;
use App\Models\KKN\Dosen;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\SertifikatKkn;
use App\Services\CertificateService;
use Illuminate\Support\Facades\Hash;

/**
 * Regression tests untuk fix R11-API-003 / R9-007 / F-04.
 * Memastikan:
 *   - Endpoint mengembalikan binary PDF dengan Content-Type application/pdf
 *     (bukan JSON dengan download_url seperti bug sebelumnya).
 *   - Authorization layers (student own, DPL group-scoped, revoked blocked).
 *   - Error paths mengembalikan JSON envelope (bukan masked PDF).
 */

beforeEach(function () {
    $this->periode = createActivePeriod('finished');

    $this->studentUser = createCompleteStudent();
    $this->student = $this->studentUser->mahasiswa;

    $this->kelompok = KelompokKkn::factory()->create(['periode_id' => $this->periode->id]);

    \App\Models\KKN\PesertaKkn::factory()
        ->approved()
        ->create([
            'mahasiswa_id' => $this->student->id,
            'periode_id' => $this->periode->id,
            'kelompok_id' => $this->kelompok->id,
        ]);

    $this->nilai = NilaiKkn::factory()->finalized()->create([
        'user_id' => $this->studentUser->id,
        'kelompok_id' => $this->kelompok->id,
        'total_score' => 85,
        'letter_grade' => 'A',
    ]);

    $this->sertifikat = SertifikatKkn::create([
        'user_id' => $this->studentUser->id,
        'periode_id' => $this->periode->id,
        'nilai_kkn_id' => $this->nilai->id,
        'kelompok_id' => $this->kelompok->id,
        'certificate_number' => 'KKN/1/TESTABC',
        'verification_token' => 'TESTABC',
        'nama_mahasiswa' => $this->student->nama,
        'nim' => $this->student->nim,
        'nama_prodi' => '-',
        'nama_fakultas' => '-',
        'lokasi_kkn' => '-',
        'total_score' => 85,
        'letter_grade' => 'A',
        'issued_at' => now(),
    ]);
});

afterEach(function () {
    Mockery::close();
});

/**
 * Helper: create student user + mahasiswa lengkap sehingga lolos
 * EnsureProfileCompleted middleware. Reusable di test-test lain.
 */
function createCompleteStudent(): \App\Models\User
{
    $user = createUserWithRole('student');
    $user->update([
        'avatar' => 'avatars/test.jpg',
        'phone' => '+6281234567890',
        'address' => 'Jl. Test No. 1',
        'address_village_name' => 'Desa Test',
        'address_district_name' => 'Kec. Test',
        'address_regency_name' => 'Kab. Test',
        'address_postal_code' => '53000',
        'address_lat' => -7.5,
        'address_lng' => 109.2,
        'address_verified_at' => now(),
    ]);

    Mahasiswa::factory()->create([
        'user_id' => $user->id,
        'nik' => '3300000000000001',
        'mother_name' => 'Ibu Test',
        'birth_place' => 'Purwokerto',
        'birth_date' => '2000-01-01',
        'gender' => 'L',
        'shirt_size' => 'L',
    ]);

    return $user->fresh(['mahasiswa']);
}

/**
 * Mock CertificateService agar test tidak bergantung pada DomPDF + blade
 * render (yang butuh template image, font, dll.). Kita hanya ingin verify
 * controller memanggil service dan mengembalikan Symfony BinaryFileResponse.
 */
function mockCertificatePdf(): void
{
    $mock = Mockery::mock(CertificateService::class);
    $mock->shouldReceive('generateForStudent')->andReturnUsing(function () {
        $pdf = Mockery::mock(\Barryvdh\DomPDF\PDF::class);
        $pdf->shouldReceive('download')->andReturnUsing(
            fn ($name) => response('%PDF-1.4 fake pdf content', 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => "attachment; filename=\"$name\"",
            ])
        );
        return $pdf;
    });
    app()->instance(CertificateService::class, $mock);
}

it('returns binary PDF with application/pdf content-type for owner', function () {
    mockCertificatePdf();

    $response = $this->actingAs($this->studentUser)
        ->get("/api/v1/student/certificates/{$this->sertifikat->id}/download");

    $response->assertOk();
    expect($response->headers->get('Content-Type'))->toContain('application/pdf');
    expect($response->headers->get('Content-Disposition'))->toContain('Sertifikat_KKN_');
    expect($response->getContent())->toStartWith('%PDF');
});

it('forbids student from downloading other student certificate', function () {
    $otherUser = createCompleteStudent();

    $response = $this->actingAs($otherUser)
        ->getJson("/api/v1/student/certificates/{$this->sertifikat->id}/download");

    $response->assertStatus(403);
    expect($response->headers->get('Content-Type'))->toContain('application/json');
    $response->assertJson(['success' => false, 'error' => ['code' => 'FORBIDDEN']]);
});

it('forbids revoked certificate with json envelope', function () {
    $this->sertifikat->update([
        'revoked_at' => now(),
        'revoke_reason' => 'Test revoke',
    ]);

    $response = $this->actingAs($this->studentUser)
        ->getJson("/api/v1/student/certificates/{$this->sertifikat->id}/download");

    $response->assertStatus(403);
    expect($response->headers->get('Content-Type'))->toContain('application/json');
});

it('returns 422 json when score not finalized', function () {
    $this->nilai->update(['is_finalized' => false]);

    $response = $this->actingAs($this->studentUser)
        ->getJson("/api/v1/student/certificates/{$this->sertifikat->id}/download");

    $response->assertStatus(422);
    expect($response->headers->get('Content-Type'))->toContain('application/json');
    $response->assertJson(['success' => false]);
});

it('converts RuntimeException from service to 422 json envelope', function () {
    // Kalau CertificateService::generateForStudent throw RuntimeException
    // (e.g. laporan akhir belum approved), controller harus return JSON 422
    // bukan biarkan exception propagate jadi 500 dengan content-type PDF.
    $mock = Mockery::mock(CertificateService::class);
    $mock->shouldReceive('generateForStudent')
        ->andThrow(new RuntimeException('Laporan akhir belum disetujui untuk kelompok ini'));
    app()->instance(CertificateService::class, $mock);

    $response = $this->actingAs($this->studentUser)
        ->getJson("/api/v1/student/certificates/{$this->sertifikat->id}/download");

    $response->assertStatus(422);
    expect($response->headers->get('Content-Type'))->toContain('application/json');
    $response->assertJsonFragment(['message' => 'Laporan akhir belum disetujui untuk kelompok ini']);
});

it('blocks DPL from student certificate download endpoint (route middleware)', function () {
    // Route `/api/v1/student/certificates/{id}/download` di-guard oleh
    // `role:student` — DPL (non-student) ditolak oleh route middleware
    // SEBELUM mencapai controller authorization. DPL punya endpoint admin
    // sendiri (admin/grade-reports/{score}/sertifikat).
    $dplUser = createUserWithRole('dpl');
    Dosen::factory()->create(['user_id' => $dplUser->id]);

    $response = $this->actingAs($dplUser->fresh())
        ->getJson("/api/v1/student/certificates/{$this->sertifikat->id}/download");

    $response->assertStatus(403);
    expect($response->headers->get('Content-Type'))->toContain('application/json');
});
