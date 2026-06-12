<?php

declare(strict_types=1);

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Regression test untuk audit F-02 fix: FinalReport restrict ke ketua kelompok.
 *
 * Sebelum fix, setiap anggota kelompok bisa submit laporan akhir yang
 * meng-overwrite submission anggota lain (karena query hanya by kelompok_id
 * tanpa ownership check). Sekarang hanya peserta dengan role='Ketua' boleh
 * POST /api/v1/student/final-report.
 */
beforeEach(function () {
    $this->periode = createActivePeriod('grading');
    $this->kelompok = KelompokKkn::factory()->create(['periode_id' => $this->periode->id]);
});

function createPesertaInKelompok(KelompokKkn $kelompok, ?int $periodeId, string $role = 'Anggota'): array
{
    $user = createUserWithRole('student');
    $user->update([
        'avatar' => 'avatars/test.jpg',
        'phone' => '+62812'.rand(1000000, 9999999),
        'address' => 'Jl. Test',
        'address_village_name' => 'Desa',
        'address_district_name' => 'Kec',
        'address_regency_name' => 'Kab',
        'address_postal_code' => '53000',
        'address_lat' => -7.5,
        'address_lng' => 109.2,
        'address_verified_at' => now(),
    ]);

    $mahasiswa = Mahasiswa::factory()->create([
        'user_id' => $user->id,
        'nik' => '33'.rand(10000000000000, 99999999999999),
        'mother_name' => 'Ibu',
        'birth_place' => 'Purwokerto',
        'birth_date' => '2000-01-01',
        'gender' => 'L',
        'shirt_size' => 'L',
    ]);

    PesertaKkn::create([
        'mahasiswa_id' => $mahasiswa->id,
        'periode_id' => $periodeId,
        'kelompok_id' => $kelompok->id,
        'status' => 'approved',
        'approved_at' => now(),
        'placement_is_live' => true,
        'role' => $role,
    ]);

    return ['user' => $user->fresh(['mahasiswa']), 'mahasiswa' => $mahasiswa];
}

it('index returns is_leader=true for ketua', function () {
    ['user' => $leaderUser] = createPesertaInKelompok($this->kelompok, $this->periode->id, 'Ketua');

    $response = $this->actingAs($leaderUser)
        ->getJson('/api/v1/student/final-report');

    $response->assertOk()->assertJsonPath('data.is_leader', true);
});

it('index returns is_leader=false for non-ketua member', function () {
    ['user' => $memberUser] = createPesertaInKelompok($this->kelompok, $this->periode->id, 'Anggota');

    $response = $this->actingAs($memberUser)
        ->getJson('/api/v1/student/final-report');

    $response->assertOk()->assertJsonPath('data.is_leader', false);
});

it('forbids non-ketua member from submitting final report', function () {
    Storage::fake('local');

    ['user' => $memberUser] = createPesertaInKelompok($this->kelompok, $this->periode->id, 'Anggota');

    $response = $this->actingAs($memberUser)
        ->postJson('/api/v1/student/final-report', [
            'title' => 'Laporan Akhir Test',
            'file' => UploadedFile::fake()->create('report.pdf', 100, 'application/pdf'),
        ]);

    $response->assertStatus(403)
        ->assertJsonFragment([
            'message' => 'Hanya ketua kelompok yang dapat mengunggah laporan akhir. Silakan koordinasikan dengan ketua kelompok Anda.',
        ]);
});

it('prevents member B from overwriting member A submission', function () {
    // Membuat 2 anggota non-ketua. Keduanya coba submit — harus ditolak.
    ['user' => $memberA] = createPesertaInKelompok($this->kelompok, $this->periode->id, 'Anggota');
    ['user' => $memberB] = createPesertaInKelompok($this->kelompok, $this->periode->id, 'Anggota');

    Storage::fake('local');

    $this->actingAs($memberA)
        ->postJson('/api/v1/student/final-report', [
            'title' => 'Laporan A',
            'file' => UploadedFile::fake()->create('a.pdf', 100, 'application/pdf'),
        ])
        ->assertStatus(403);

    $this->actingAs($memberB)
        ->postJson('/api/v1/student/final-report', [
            'title' => 'Laporan B',
            'file' => UploadedFile::fake()->create('b.pdf', 100, 'application/pdf'),
        ])
        ->assertStatus(403);

    // Tidak ada laporan akhir tersimpan karena dua-duanya di-reject.
    expect(LaporanAkhir::where('kelompok_id', $this->kelompok->id)->count())
        ->toBe(0);
});

it('forbids submit when student not placed in group', function () {
    // Student approved tapi belum masuk kelompok.
    $user = createUserWithRole('student');
    $user->update([
        'avatar' => 'a.jpg', 'phone' => '+628123', 'address' => 'x',
        'address_village_name' => 'v', 'address_district_name' => 'd',
        'address_regency_name' => 'r', 'address_postal_code' => '53000',
        'address_lat' => -7, 'address_lng' => 109, 'address_verified_at' => now(),
    ]);
    $mahasiswa = Mahasiswa::factory()->create([
        'user_id' => $user->id,
        'nik' => '3301234567891001',
        'mother_name' => 'x', 'birth_place' => 'x', 'birth_date' => '2000-01-01',
        'gender' => 'L', 'shirt_size' => 'L',
    ]);
    PesertaKkn::create([
        'mahasiswa_id' => $mahasiswa->id,
        'periode_id' => $this->periode->id,
        'kelompok_id' => null,
        'status' => 'approved',
        'approved_at' => now(),
    ]);

    Storage::fake('local');

    $response = $this->actingAs($user->fresh())
        ->postJson('/api/v1/student/final-report', [
            'title' => 'Test',
            'file' => UploadedFile::fake()->create('x.pdf', 100, 'application/pdf'),
        ]);

    $response->assertStatus(403)->assertJsonFragment([
        'message' => 'Anda belum ditempatkan di kelompok.',
    ]);
});
