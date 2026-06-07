<?php

declare(strict_types=1);

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\SystemSetting;

/**
 * Regression test untuk audit FLOW-003 + F-13 + F-14 fix:
 * Dashboard mahasiswa sekarang mengekspos data ketua kelompok dari API
 * (bukan hardcoded "Sedang Ditentukan"), serta threshold certificate_min_score
 * dan min_daily_reports dari SystemSetting.
 */
beforeEach(function () {
    $this->periode = createActivePeriod('execution');
    $this->kelompok = KelompokKkn::factory()->create(['periode_id' => $this->periode->id]);
});

function makeCompleteStudent(KelompokKkn $kelompok, ?int $periodeId, string $role = 'Anggota'): array
{
    $user = createUserWithRole('student');
    $user->update([
        'avatar' => 'a.jpg', 'phone' => '+62812'.rand(10000, 99999),
        'address' => 'Jl. X', 'address_village_name' => 'D',
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
        'placement_is_live' => true,
        'role' => $role,
    ]);

    return ['user' => $user->fresh(['mahasiswa']), 'mahasiswa' => $mahasiswa];
}

it('dashboard returns leader info when ketua exists in group', function () {
    $leader = makeCompleteStudent($this->kelompok, $this->periode->id, 'Ketua');
    $member = makeCompleteStudent($this->kelompok, $this->periode->id, 'Anggota');

    // Member view dashboard — harus lihat ketua adalah leader user.
    $response = $this->actingAs($member['user'])
        ->getJson('/api/v1/student/dashboard');

    $response->assertOk();
    $leaderPayload = $response->json('data.registration.group.leader');

    expect($leaderPayload)->not->toBeNull();
    expect($leaderPayload['name'])->toBe($leader['mahasiswa']->nama);
    expect($leaderPayload['nim'])->toBe($leader['mahasiswa']->nim);
    expect($leaderPayload['is_self'])->toBeFalse();
});

it('dashboard marks is_self=true when current user is the leader', function () {
    $leader = makeCompleteStudent($this->kelompok, $this->periode->id, 'Ketua');

    $response = $this->actingAs($leader['user'])
        ->getJson('/api/v1/student/dashboard');

    $response->assertOk();
    expect($response->json('data.registration.group.leader.is_self'))->toBeTrue();
    expect($response->json('data.registration.group.leader.name'))->toBe($leader['mahasiswa']->nama);
});

it('dashboard returns null leader when no ketua assigned', function () {
    $member = makeCompleteStudent($this->kelompok, $this->periode->id, 'Anggota');

    $response = $this->actingAs($member['user'])
        ->getJson('/api/v1/student/dashboard');

    $response->assertOk();
    expect($response->json('data.registration.group.leader'))->toBeNull();
});

it('dashboard exposes certificate_min_score and min_daily_reports from SystemSetting', function () {
    SystemSetting::set('certificate_min_score', '75');
    SystemSetting::set('min_daily_reports', '40');

    $member = makeCompleteStudent($this->kelompok, $this->periode->id, 'Anggota');

    $response = $this->actingAs($member['user'])
        ->getJson('/api/v1/student/dashboard');

    $response->assertOk();
    expect((float) $response->json('data.certificate_min_score'))->toBe(75.0);
    expect((int) $response->json('data.min_daily_reports'))->toBe(40);

    // Reset ke default untuk tidak pollute test lain.
    SystemSetting::set('certificate_min_score', '70');
    SystemSetting::set('min_daily_reports', '30');
});

it('dashboard falls back to defaults when SystemSetting missing', function () {
    // Default: 70 & 30 dari SystemSetting::get(key, default).
    $member = makeCompleteStudent($this->kelompok, $this->periode->id, 'Anggota');

    $response = $this->actingAs($member['user'])
        ->getJson('/api/v1/student/dashboard');

    $response->assertOk();
    expect((float) $response->json('data.certificate_min_score'))->toBeGreaterThanOrEqual(70);
    expect((int) $response->json('data.min_daily_reports'))->toBeGreaterThanOrEqual(30);
});
