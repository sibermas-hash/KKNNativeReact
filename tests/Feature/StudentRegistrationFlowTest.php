<?php

use App\Enums\KknType;
use App\Models\KKN\AntrianKkn;
use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Prodi;
use App\Models\KKN\SlotTerkunci;
use App\Models\KKN\SystemSetting;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
    SystemSetting::set('group_male_min_ratio', '20');
    SystemSetting::set('group_male_target_ratio', '30');
});

function createStudentUser(array $studentOverrides = []): array
{
    $user = User::factory()->create([
        'phone' => '081234567890',
        'address' => 'Jl. Raya Karangsari No. 10',
        'domicile_village_name' => 'Desa Asal Mahasiswa',
        'domicile_district_name' => 'Kecamatan Asal Mahasiswa',
        'domicile_regency_name' => 'Kabupaten Asal Mahasiswa',
        'address_verified_at' => now(),
    ]);
    $user->assignRole('student');

    $student = Mahasiswa::factory()->create([
        'user_id' => $user->id,
        'nama' => 'Ahmad Fauzi',
        'nim' => '2024001234',
        'batch_year' => 2024,
        'nik' => '3301010101010001',
        'mother_name' => 'Siti Fauziah',
        'birth_place' => 'Banyumas',
        'birth_date' => '2003-01-01',
        'gender' => 'L',
        'shirt_size' => 'L',
        ...$studentOverrides,
    ]);

    return compact('user', 'student');
}

test('student registration page exposes active periods and automatic placement context', function () {
    ['user' => $user] = createStudentUser();

    $period = Periode::factory()->active()->create([
        'name' => 'KKN Reguler 2026',
        'jenis' => KknType::REGULER,
        'program_type' => Periode::PROGRAM_TYPE_REGULER,
    ]);

    $location = Lokasi::factory()->create([
        'village_name' => 'Desa Karangsari',
        'district_name' => 'Kecamatan Kembaran',
        'regency_name' => 'Kabupaten Banyumas',
    ]);

    $group = KelompokKkn::factory()->create([
        'periode_id' => $period->id,
        'location_id' => $location->id,
        'nama_kelompok' => 'Kelompok Melati',
        'status' => 'active',
        'capacity' => 12,
    ]);

    $existingFemaleStudent = Mahasiswa::factory()->create([
        'gender' => 'P',
    ]);

    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $existingFemaleStudent->id,
        'periode_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);

    KelompokKkn::factory()->create([
        'periode_id' => $period->id,
        'status' => 'draft',
    ]);

    $this->actingAs($user)
        ->get(route('student.registration.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Register')
            ->has('periods', 1)
            ->has('managed_programs', 0)
            ->where('periods.0.nama', 'KKN Reguler 2026')
            ->where('periods.0.self_service_enabled', true)
            ->where('periods.0.registration_mode', Periode::REGISTRATION_MODE_OPEN)
            ->where('periods.0.placement_mode', Periode::PLACEMENT_MODE_AUTOMATIC_AFTER_APPROVAL)
            ->where('periods.0.guide.requirements.0', 'Lulus ujian BTA/PPI.')
            ->where('domicile_profile.is_complete', true)
            ->where('periods.0.kelompok.0.nama_kelompok', 'Kelompok Melati')
            ->where('periods.0.kelompok.0.peserta_count', 1)
            ->where('periods.0.kelompok.0.male_member_count', 0)
            ->where('periods.0.kelompok.0.female_member_count', 1)
            ->where('periods.0.kelompok.0.male_min_required', 3)
            ->where('periods.0.kelompok.0.male_target_maximum', 3)
            ->where('periods.0.kelompok.0.requires_more_male_members', true)
            ->where('periods.0.kelompok.0.reserved_male_slots', 3)
            ->where('periods.0.kelompok.0.lokasi.full_name', 'Desa Karangsari, Kecamatan Kembaran, Kabupaten Banyumas')
            ->has('periods.0.kelompok', 1)
        );
});

test('student registration page uses configurable male ratio settings', function () {
    SystemSetting::set('group_male_min_ratio', '25');
    SystemSetting::set('group_male_target_ratio', '35');

    ['user' => $user] = createStudentUser();

    $period = Periode::factory()->active()->create([
        'name' => 'KKN Reguler 2026',
        'jenis' => KknType::REGULER,
        'program_type' => Periode::PROGRAM_TYPE_REGULER,
    ]);

    $group = KelompokKkn::factory()->create([
        'periode_id' => $period->id,
        'status' => 'active',
        'capacity' => 12,
    ]);

    $this->actingAs($user)
        ->get(route('student.registration.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('periods.0.nama', 'KKN Reguler 2026')
            ->where('periods.0.kelompok.0.male_min_required', 3)
            ->where('periods.0.kelompok.0.male_target_maximum', 4)
            ->where('periods.0.kelompok.0.male_min_percentage', 25)
            ->where('periods.0.kelompok.0.male_target_percentage', 35)
        );
});

test('special program period is exposed as non self service registration', function () {
    ['user' => $user] = createStudentUser();

    Periode::factory()->active()->create([
        'name' => 'KKN Nusantara 2026',
        'jenis' => KknType::NUSANTARA,
        'program_type' => Periode::PROGRAM_TYPE_NUSANTARA,
        'registration_mode' => Periode::REGISTRATION_MODE_SELECTIVE,
        'placement_mode' => Periode::PLACEMENT_MODE_MANUAL_ADMIN,
    ]);

    $this->actingAs($user)
        ->get(route('student.registration.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Register')
            ->has('periods', 0)
            ->has('managed_programs', 1)
            ->where('managed_programs.0.self_service_enabled', false)
            ->where('managed_programs.0.program_type', Periode::PROGRAM_TYPE_NUSANTARA)
            ->where('managed_programs.0.registration_mode', Periode::REGISTRATION_MODE_SELECTIVE)
            ->where('managed_programs.0.placement_mode', Periode::PLACEMENT_MODE_MANUAL_ADMIN)
            ->where('managed_programs.0.guide.requirements.1', 'Minimal telah menempuh 100 SKS.')
        );
});

test('student registration page treats legacy bta status as passed for ui gating', function () {
    ['user' => $user] = createStudentUser([
        'is_bta_ppi_passed' => false,
        'status_bta_ppi' => 'LULUS',
    ]);

    $period = Periode::factory()->active()->create([
        'name' => 'KKN Legacy BTA 2026',
    ]);

    KelompokKkn::factory()->create([
        'periode_id' => $period->id,
        'status' => 'active',
    ]);

    $this->actingAs($user)
        ->get(route('student.registration.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Register')
            ->where('student_academic.is_bta_ppi_passed', true)
            ->where('student_academic.bta_ppi_status', 'LULUS')
        );
});

test('student can submit regular registration and waits for admin approval before group placement', function () {
    ['user' => $user, 'student' => $student] = createStudentUser();

    $period = Periode::factory()->active()->create();
    $sameRegencyGroup = KelompokKkn::factory()->create([
        'periode_id' => $period->id,
        'status' => 'active',
        'location_id' => Lokasi::factory()->create([
            'village_name' => 'Desa Asal',
            'district_name' => 'Kecamatan Asal',
            'regency_name' => 'Kabupaten Asal Mahasiswa',
        ])->id,
    ]);
    $group = KelompokKkn::factory()->create([
        'periode_id' => $period->id,
        'status' => 'active',
        'location_id' => Lokasi::factory()->create([
            'village_name' => 'Desa Penempatan',
            'district_name' => 'Kecamatan Penempatan',
            'regency_name' => 'Kabupaten Penempatan',
        ])->id,
    ]);

    $this->actingAs($user)
        ->post(route('student.registration.store'), [
            'periode_id' => $period->id,
            'notes' => 'Siap mengikuti KKN.',
        ])
        ->assertRedirect()
        ->dumpSession()->assertSessionHas('success');

    $this->assertDatabaseHas('peserta_kkn', [
        'mahasiswa_id' => $student->id,
        'periode_id' => $period->id,
        'kelompok_id' => null,
        'status' => 'pending',
    ], 'kkn');

    $this->assertDatabaseHas('antrian_kkn', [
        'mahasiswa_id' => $student->id,
        'periode_id' => $period->id,
        'status' => 'menunggu',
    ], 'kkn');

    $this->assertDatabaseMissing('peserta_kkn', [
        'mahasiswa_id' => $student->id,
        'periode_id' => $period->id,
        'kelompok_id' => $sameRegencyGroup->id,
    ], 'kkn');
});

test('student with approved group registration is redirected away from registration page', function () {
    ['user' => $user, 'student' => $student] = createStudentUser();

    $period = Periode::factory()->active()->create();
    $group = KelompokKkn::factory()->create([
        'periode_id' => $period->id,
        'status' => 'active',
    ]);

    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $student->id,
        'periode_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);

    $this->actingAs($user)
        ->get(route('student.registration.create'))
        ->assertRedirect(route('student.dashboard'))
        ->assertSessionHas('info');
});

test('rejected registration exposes rejection reason for student follow up', function () {
    ['user' => $user, 'student' => $student] = createStudentUser();

    $period = Periode::factory()->active()->create([
        'name' => 'KKN Revisi 2026',
    ]);

    PesertaKkn::factory()->create([
        'mahasiswa_id' => $student->id,
        'periode_id' => $period->id,
        'status' => 'rejected',
        'notes' => 'Catatan awal mahasiswa.',
        'rejection_reason' => 'Surat sehat kurang jelas dan alamat belum lengkap.',
    ]);

    $this->actingAs($user)
        ->get(route('student.registration.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Register')
            ->where('periods.0.registration.status', 'rejected')
            ->where('periods.0.registration.rejection_reason', 'Surat sehat kurang jelas dan alamat belum lengkap.')
        );
});

test('rejected student can resubmit registration after fixing their data', function () {
    ['user' => $user, 'student' => $student] = createStudentUser();

    $period = Periode::factory()->active()->create();
    $oldGroup = KelompokKkn::factory()->create([
        'periode_id' => $period->id,
        'status' => 'active',
        'location_id' => Lokasi::factory()->create([
            'village_name' => 'Desa Asal',
            'district_name' => 'Kecamatan Asal',
            'regency_name' => 'Kabupaten Asal Mahasiswa',
        ])->id,
    ]);
    $newGroup = KelompokKkn::factory()->create([
        'periode_id' => $period->id,
        'status' => 'active',
        'location_id' => Lokasi::factory()->create([
            'village_name' => 'Desa Baru',
            'district_name' => 'Kecamatan Baru',
            'regency_name' => 'Kabupaten Penempatan Baru',
        ])->id,
    ]);

    PesertaKkn::factory()->create([
        'mahasiswa_id' => $student->id,
        'periode_id' => $period->id,
        'kelompok_id' => $oldGroup->id,
        'status' => 'rejected',
        'notes' => 'Catatan awal mahasiswa.',
        'rejection_reason' => 'Mohon lengkapi alamat domisili dan unggah ulang surat sehat.',
        'revision_count' => 0,
    ]);

    $this->actingAs($user)
        ->post(route('student.registration.store'), [
            'periode_id' => $period->id,
            'notes' => 'Dokumen dan biodata sudah diperbaiki.',
        ])
        ->assertRedirect()
        ->dumpSession()->assertSessionHas('success');

    $this->assertDatabaseHas('peserta_kkn', [
        'mahasiswa_id' => $student->id,
        'periode_id' => $period->id,
        'kelompok_id' => null,
        'status' => 'pending',
        'notes' => 'Dokumen dan biodata sudah diperbaiki.',
        'rejection_reason' => 'Mohon lengkapi alamat domisili dan unggah ulang surat sehat.',
        'revision_count' => 1,
    ], 'kkn');

    expect(
        PesertaKkn::query()
            ->where('mahasiswa_id', $student->id)
            ->where('periode_id', $period->id)
            ->value('resubmitted_at')
    )->not->toBeNull();
});

test('student with approved group registration cannot update or leave registration anymore', function () {
    ['user' => $user, 'student' => $student] = createStudentUser();

    $period = Periode::factory()->active()->create();
    $group = KelompokKkn::factory()->create([
        'periode_id' => $period->id,
        'status' => 'active',
    ]);

    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $student->id,
        'periode_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);

    $this->actingAs($user)
        ->post(route('student.registration.store'), [
            'periode_id' => $period->id,
        ])
        ->assertRedirect(route('student.dashboard'))
        ->assertSessionHas('error');

    $this->actingAs($user)
        ->delete(route('student.registration.leave', $period->id))
        ->assertRedirect(route('student.dashboard'))
        ->assertSessionHas('error');
});

test('student dashboard receives frontend friendly registration payload', function () {
    ['user' => $user, 'student' => $student] = createStudentUser();

    $lecturerUser = User::factory()->create();
    $lecturer = Dosen::factory()->create([
        'user_id' => $lecturerUser->id,
        'nama' => 'Dr. Siti Aminah',
        'nip' => '198901012020122001',
    ]);

    $period = Periode::factory()->active()->create([
        'name' => 'KKN Reguler 2026',
    ]);

    $location = Lokasi::factory()->create([
        'village_name' => 'Desa Karangsari',
        'district_name' => 'Kecamatan Kembaran',
        'regency_name' => 'Kabupaten Banyumas',
    ]);

    $group = KelompokKkn::factory()->create([
        'periode_id' => $period->id,
        'location_id' => $location->id,
        'dpl_id' => $lecturer->id,
        'nama_kelompok' => 'Kelompok Melati',
    ]);

    $group->dosen()->attach($lecturer->id, ['role' => 'Ketua']);

    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $student->id,
        'periode_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);

    $this->actingAs($user)
        ->get(route('student.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Dashboard')
            ->where('student.name', 'Ahmad Fauzi')
            ->where('student.nim', '2024001234')
            ->where('registration.status', 'approved')
            ->where('registration.period.name', 'KKN Reguler 2026')
            ->where('registration.group.name', 'Kelompok Melati')
            ->where('registration.group.location.name', 'Desa Karangsari, Kecamatan Kembaran, Kabupaten Banyumas')
            ->where('registration.group.lecturer.name', 'Dr. Siti Aminah')
        );
});

test('student dashboard prioritizes registration from the active period over newer historical records', function () {
    ['user' => $user, 'student' => $student] = createStudentUser();

    $activePeriod = Periode::factory()->active()->create([
        'name' => 'KKN Aktif 2026',
    ]);
    $oldPeriod = Periode::factory()->create([
        'name' => 'KKN Lama 2025',
    ]);

    $activeGroup = KelompokKkn::factory()->create([
        'periode_id' => $activePeriod->id,
        'status' => 'active',
        'nama_kelompok' => 'Kelompok Aktif',
    ]);

    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $student->id,
        'periode_id' => $activePeriod->id,
        'kelompok_id' => $activeGroup->id,
        'created_at' => now()->subDay(),
        'updated_at' => now()->subDay(),
    ]);

    PesertaKkn::factory()->create([
        'mahasiswa_id' => $student->id,
        'periode_id' => $oldPeriod->id,
        'status' => 'rejected',
        'rejection_reason' => 'Riwayat lama.',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('student.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Dashboard')
            ->where('registration.period.name', 'KKN Aktif 2026')
            ->where('registration.group.name', 'Kelompok Aktif')
            ->where('registration.status', 'approved')
        );
});

test('student dashboard scopes reports and grade to the registration group that is currently active', function () {
    ['user' => $user, 'student' => $student] = createStudentUser();

    $activePeriod = Periode::factory()->active()->create([
        'name' => 'KKN Aktif 2026',
    ]);
    $oldPeriod = Periode::factory()->create([
        'name' => 'KKN Lama 2025',
    ]);

    $activeGroup = KelompokKkn::factory()->create([
        'periode_id' => $activePeriod->id,
        'status' => 'active',
        'nama_kelompok' => 'Kelompok Aktif',
    ]);
    $oldGroup = KelompokKkn::factory()->create([
        'periode_id' => $oldPeriod->id,
        'status' => 'active',
        'nama_kelompok' => 'Kelompok Lama',
    ]);

    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $student->id,
        'periode_id' => $activePeriod->id,
        'kelompok_id' => $activeGroup->id,
        'created_at' => now()->subDay(),
        'updated_at' => now()->subDay(),
    ]);

    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $student->id,
        'periode_id' => $oldPeriod->id,
        'kelompok_id' => $oldGroup->id,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    KegiatanKkn::factory()->create([
        'mahasiswa_id' => $student->id,
        'kelompok_id' => $activeGroup->id,
    ]);
    KegiatanKkn::factory()->count(2)->create([
        'mahasiswa_id' => $student->id,
        'kelompok_id' => $oldGroup->id,
    ]);

    LaporanAkhir::factory()->create([
        'mahasiswa_id' => $student->id,
        'kelompok_id' => $oldGroup->id,
        'title' => 'Laporan Lama',
        'submitted_at' => now(),
    ]);
    LaporanAkhir::factory()->create([
        'mahasiswa_id' => $student->id,
        'kelompok_id' => $activeGroup->id,
        'title' => 'Laporan Aktif',
        'submitted_at' => now()->subHour(),
    ]);

    NilaiKkn::factory()->finalized()->create([
        'user_id' => $user->id,
        'kelompok_id' => $oldGroup->id,
        'total_score' => 91,
        'letter_grade' => 'A',
        'admin_graded_at' => now(),
    ]);
    NilaiKkn::factory()->finalized()->create([
        'user_id' => $user->id,
        'kelompok_id' => $activeGroup->id,
        'total_score' => 78,
        'letter_grade' => 'B',
        'admin_graded_at' => now()->subHour(),
    ]);

    $this->actingAs($user)
        ->get(route('student.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Dashboard')
            ->where('registration.period.name', 'KKN Aktif 2026')
            ->where('dailyReportCount', 1)
            ->where('finalReport.title', 'Laporan Aktif')
            ->where('grade.score', 78)
            ->where('grade.letter', 'B')
        );
});

test('faculty slot restriction is enforced when admin approves a regular registration', function () {
    $facultyA = Fakultas::factory()->create(['nama' => 'Fakultas Syariah']);
    $programA = Prodi::factory()->create([
        'fakultas_id' => $facultyA->id,
        'nama' => 'Hukum Keluarga',
    ]);
    $facultyB = Fakultas::factory()->create(['nama' => 'Fakultas Dakwah']);
    $admin = User::factory()->create();
    $admin->assignRole('superadmin');

    ['user' => $user, 'student' => $student] = createStudentUser([
        'fakultas_id' => $facultyA->id,
        'prodi_id' => $programA->id,
    ]);

    $otherStudent = Mahasiswa::factory()->create([
        'fakultas_id' => $facultyA->id,
        'prodi_id' => $programA->id,
    ]);

    $period = Periode::factory()->active()->create();
    $group = KelompokKkn::factory()->create([
        'periode_id' => $period->id,
        'capacity' => 2,
        'status' => 'active',
        'location_id' => Lokasi::factory()->create([
            'village_name' => 'Desa Penempatan',
            'district_name' => 'Kecamatan Penempatan',
            'regency_name' => 'Kabupaten Penempatan',
        ])->id,
    ]);

    SlotTerkunci::create([
        'kelompok_id' => $group->id,
        'tipe_slot' => 'fakultas',
        'fakultas_id' => $facultyB->id,
        'kuota_slot' => 1,
    ]);

    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $otherStudent->id,
        'periode_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);

    $this->actingAs($user)
        ->post(route('student.registration.store'), [
            'periode_id' => $period->id,
        ])
        ->assertRedirect()
        ->dumpSession()->assertSessionHas('success');

    $registration = PesertaKkn::query()
        ->where('mahasiswa_id', $student->id)
        ->where('periode_id', $period->id)
        ->firstOrFail();

    $this->assertDatabaseHas('peserta_kkn', [
        'mahasiswa_id' => $student->id,
        'periode_id' => $period->id,
        'status' => 'pending',
        'kelompok_id' => null,
    ], 'kkn');

    $this->actingAs($admin)
        ->from(route('admin.pendaftaran.show', $registration))
        ->patch(route('admin.pendaftaran.setujui', $registration))
        ->assertRedirect(route('admin.pendaftaran.show', $registration))
        ->assertSessionHasErrors('kelompok_id');
});

test('minimum male ratio is enforced when admin approves a regular registration', function () {
    $admin = User::factory()->create();
    $admin->assignRole('superadmin');

    ['user' => $user, 'student' => $student] = createStudentUser([
        'gender' => 'P',
        'nama' => 'Aisyah Putri',
        'nim' => '2024002001',
    ]);

    $existingMaleStudent = Mahasiswa::factory()->create([
        'gender' => 'L',
    ]);
    $otherFemaleStudent = Mahasiswa::factory()->create([
        'gender' => 'P',
    ]);
    $anotherFemaleStudent = Mahasiswa::factory()->create([
        'gender' => 'P',
    ]);

    $period = Periode::factory()->active()->create();
    $group = KelompokKkn::factory()->create([
        'periode_id' => $period->id,
        'capacity' => 10,
        'status' => 'active',
        'location_id' => Lokasi::factory()->create([
            'village_name' => 'Desa Penempatan',
            'district_name' => 'Kecamatan Penempatan',
            'regency_name' => 'Kabupaten Penempatan',
        ])->id,
    ]);

    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $existingMaleStudent->id,
        'periode_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);
    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $otherFemaleStudent->id,
        'periode_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);
    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $anotherFemaleStudent->id,
        'periode_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);
    foreach (range(1, 6) as $_) {
        $femaleStudent = Mahasiswa::factory()->create([
            'gender' => 'P',
        ]);

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $femaleStudent->id,
            'periode_id' => $period->id,
            'kelompok_id' => $group->id,
        ]);
    }

    $this->actingAs($user)
        ->post(route('student.registration.store'), [
            'periode_id' => $period->id,
        ])
        ->assertRedirect()
        ->dumpSession()->assertSessionHas('success');

    $registration = PesertaKkn::query()
        ->where('mahasiswa_id', $student->id)
        ->where('periode_id', $period->id)
        ->firstOrFail();

    $this->assertDatabaseHas('peserta_kkn', [
        'mahasiswa_id' => $student->id,
        'periode_id' => $period->id,
        'status' => 'pending',
        'kelompok_id' => null,
    ], 'kkn');

    $this->actingAs($admin)
        ->from(route('admin.pendaftaran.show', $registration))
        ->patch(route('admin.pendaftaran.setujui', $registration))
        ->assertRedirect(route('admin.pendaftaran.show', $registration))
        ->assertSessionHasErrors('kelompok_id');
});

test('male student can fill a seat while group is still below the minimum male ratio', function () {
    ['user' => $user, 'student' => $student] = createStudentUser([
        'gender' => 'L',
        'nama' => 'Rizky Pratama',
        'nim' => '2024002002',
    ]);

    $existingMaleStudent = Mahasiswa::factory()->create([
        'gender' => 'L',
    ]);
    $otherFemaleStudent = Mahasiswa::factory()->create([
        'gender' => 'P',
    ]);
    $anotherFemaleStudent = Mahasiswa::factory()->create([
        'gender' => 'P',
    ]);

    $period = Periode::factory()->active()->create();
    $group = KelompokKkn::factory()->create([
        'periode_id' => $period->id,
        'capacity' => 10,
        'status' => 'active',
    ]);

    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $existingMaleStudent->id,
        'periode_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);
    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $otherFemaleStudent->id,
        'periode_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);
    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $anotherFemaleStudent->id,
        'periode_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);
    foreach (range(1, 6) as $_) {
        $femaleStudent = Mahasiswa::factory()->create([
            'gender' => 'P',
        ]);

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $femaleStudent->id,
            'periode_id' => $period->id,
            'kelompok_id' => $group->id,
        ]);
    }

    $this->actingAs($user)
        ->post(route('student.registration.store'), [
            'periode_id' => $period->id,
        ])
        ->assertRedirect()
        ->dumpSession()->assertSessionHas('success');

    $this->assertDatabaseHas('peserta_kkn', [
        'mahasiswa_id' => $student->id,
        'periode_id' => $period->id,
        'kelompok_id' => null,
        'status' => 'pending',
    ], 'kkn');
});

test('male student can still join when male composition has reached the ideal target', function () {
    ['user' => $user, 'student' => $student] = createStudentUser([
        'gender' => 'L',
        'nama' => 'Bagas Saputra',
        'nim' => '2024002003',
    ]);

    $period = Periode::factory()->active()->create();
    $group = KelompokKkn::factory()->create([
        'periode_id' => $period->id,
        'capacity' => 10,
        'status' => 'active',
    ]);

    PesertaKkn::factory()->count(3)->approved()->create([
        'periode_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);
    PesertaKkn::factory()->count(6)->approved()->create([
        'periode_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);

    foreach (PesertaKkn::where('kelompok_id', $group->id)->take(3)->get() as $registration) {
        $registration->mahasiswa()->update([
            'gender' => 'L',
        ]);
    }

    foreach (PesertaKkn::where('kelompok_id', $group->id)->skip(3)->take(6)->get() as $registration) {
        $registration->mahasiswa()->update([
            'gender' => 'P',
        ]);
    }

    $this->actingAs($user)
        ->post(route('student.registration.store'), [
            'periode_id' => $period->id,
        ])
        ->assertRedirect()
        ->dumpSession()->assertSessionHas('success');

    $this->assertDatabaseHas('peserta_kkn', [
        'mahasiswa_id' => $student->id,
        'periode_id' => $period->id,
        'kelompok_id' => null,
        'status' => 'pending',
    ], 'kkn');
});

test('student with approved registration cannot leave group through registration flow while locked', function () {
    ['user' => $user, 'student' => $student] = createStudentUser();

    $period = Periode::factory()->active()->create([
        'start_date' => now()->addDays(30)->toDateString(),
    ]);

    $group = KelompokKkn::factory()->create([
        'periode_id' => $period->id,
        'status' => 'active',
    ]);

    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $student->id,
        'periode_id' => $period->id,
        'kelompok_id' => $group->id,
        'joined_group_at' => now()->subHours(2),
        'group_locked_until' => now()->addHours(6),
    ]);

    AntrianKkn::create([
        'mahasiswa_id' => $student->id,
        'periode_id' => $period->id,
        'status' => 'dalam_kelompok',
        'joined_at' => now()->subDay(),
    ]);

    $this->actingAs($user)
        ->delete(route('student.registration.leave', $period))
        ->assertRedirect(route('student.dashboard'))
        ->assertSessionHas('error');
});

test('student with approved registration remains locked even after cooling period expires', function () {
    ['user' => $user, 'student' => $student] = createStudentUser();

    $period = Periode::factory()->active()->create([
        'start_date' => now()->addDays(30)->toDateString(),
    ]);

    $group = KelompokKkn::factory()->create([
        'periode_id' => $period->id,
        'status' => 'active',
    ]);

    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $student->id,
        'periode_id' => $period->id,
        'kelompok_id' => $group->id,
        'joined_group_at' => now()->subDays(2),
        'group_locked_until' => now()->subHour(),
    ]);

    AntrianKkn::create([
        'mahasiswa_id' => $student->id,
        'periode_id' => $period->id,
        'status' => 'dalam_kelompok',
        'joined_at' => now()->subDay(),
    ]);

    $this->actingAs($user)
        ->delete(route('student.registration.leave', $period))
        ->assertRedirect(route('student.dashboard'))
        ->assertSessionHas('error');

    $this->assertDatabaseHas('peserta_kkn', [
        'mahasiswa_id' => $student->id,
        'periode_id' => $period->id,
        'kelompok_id' => $group->id,
    ], 'kkn');

    $this->assertDatabaseHas('antrian_kkn', [
        'mahasiswa_id' => $student->id,
        'periode_id' => $period->id,
        'status' => 'dalam_kelompok',
    ], 'kkn');
});
