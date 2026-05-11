<?php

declare(strict_types=1);

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;

/**
 * Regression test untuk audit F-08 fix: faculty_admin tidak lagi bypass
 * phase middleware. Hanya superadmin + admin yang boleh bypass.
 *
 * Test ini terutama important untuk guard kasus dual-role (user punya role
 * faculty_admin DAN student transien). Sebelumnya, user seperti itu bisa
 * akses student feature di fase manapun. Sekarang harus ikut phase rules.
 */

function makeStudentWithKelompok(KelompokKkn $kelompok, ?int $periodeId): \App\Models\User
{
    $user = createUserWithRole('student');
    $user->update([
        'avatar' => 'a.jpg', 'phone' => '+62812'.rand(10000, 99999),
        'address' => 'Jl.', 'address_village_name' => 'D',
        'address_district_name' => 'K', 'address_regency_name' => 'R',
        'address_postal_code' => '53000', 'address_lat' => -7.5,
        'address_lng' => 109.2, 'address_verified_at' => now(),
    ]);

    $mahasiswa = Mahasiswa::factory()->create([
        'user_id' => $user->id,
        'nik' => '33'.rand(10000000000000, 99999999999999),
        'mother_name' => 'Ibu', 'birth_place' => 'Purwokerto',
        'birth_date' => '2000-01-01', 'gender' => 'L', 'shirt_size' => 'L',
    ]);

    PesertaKkn::create([
        'mahasiswa_id' => $mahasiswa->id,
        'periode_id' => $periodeId,
        'kelompok_id' => $kelompok->id,
        'status' => 'approved',
        'approved_at' => now(),
    ]);

    return $user->fresh(['mahasiswa']);
}

it('blocks student from execution-only endpoint during upcoming phase', function () {
    $periode = createActivePeriod('upcoming');
    $kelompok = KelompokKkn::factory()->create(['periode_id' => $periode->id]);
    $student = makeStudentWithKelompok($kelompok, $periode->id);

    $response = $this->actingAs($student)
        ->getJson('/api/v1/student/daily-reports');

    $response->assertStatus(403)
        ->assertJsonFragment(['code' => 'PHASE_BLOCKED']);
});

it('blocks faculty_admin dual-role from execution endpoint during upcoming phase', function () {
    // User punya DUA role: faculty_admin DAN student.
    // Sebelum fix, faculty_admin bypass phase → bisa akses saat upcoming.
    // Setelah fix, faculty_admin tidak bypass → harus tetap terblock.
    $periode = createActivePeriod('upcoming');
    $kelompok = KelompokKkn::factory()->create(['periode_id' => $periode->id]);
    $user = makeStudentWithKelompok($kelompok, $periode->id);
    $user->assignRole('faculty_admin');

    $response = $this->actingAs($user->fresh())
        ->getJson('/api/v1/student/daily-reports');

    $response->assertStatus(403)
        ->assertJsonFragment(['code' => 'PHASE_BLOCKED']);
});

it('allows superadmin to bypass phase middleware', function () {
    $periode = createActivePeriod('upcoming');
    $kelompok = KelompokKkn::factory()->create(['periode_id' => $periode->id]);
    $user = makeStudentWithKelompok($kelompok, $periode->id);
    $user->assignRole('superadmin');

    $response = $this->actingAs($user->fresh())
        ->getJson('/api/v1/student/daily-reports');

    // Superadmin bypass phase gate; harus lolos middleware (mungkin dapat
    // respons lain karena data, tapi bukan PHASE_BLOCKED).
    expect($response->json('error.code'))->not->toBe('PHASE_BLOCKED');
});

it('allows admin to bypass phase middleware', function () {
    $periode = createActivePeriod('upcoming');
    $kelompok = KelompokKkn::factory()->create(['periode_id' => $periode->id]);
    $user = makeStudentWithKelompok($kelompok, $periode->id);
    $user->assignRole('admin');

    $response = $this->actingAs($user->fresh())
        ->getJson('/api/v1/student/daily-reports');

    expect($response->json('error.code'))->not->toBe('PHASE_BLOCKED');
});

it('allows student to access execution endpoint during execution phase', function () {
    $periode = createActivePeriod('execution');
    $kelompok = KelompokKkn::factory()->create(['periode_id' => $periode->id]);
    $student = makeStudentWithKelompok($kelompok, $periode->id);

    $response = $this->actingAs($student)
        ->getJson('/api/v1/student/daily-reports');

    // Fase sesuai — tidak block oleh phase middleware.
    expect($response->json('error.code'))->not->toBe('PHASE_BLOCKED');
});
