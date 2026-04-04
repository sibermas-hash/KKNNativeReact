<?php

use App\Models\KKN\AntrianKkn;
use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
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
    SystemSetting::set('group_male_min_ratio', '20');
    SystemSetting::set('group_male_target_ratio', '30');
});

function createStudentUser(array $studentOverrides = []): array
{
    $user = User::factory()->create();
    $user->assignRole('student');

    $student = Mahasiswa::factory()->create([
        'user_id' => $user->id,
        'nama' => 'Ahmad Fauzi',
        'nim' => '2024001234',
        'batch_year' => 2024,
        ...$studentOverrides,
    ]);

    return compact('user', 'student');
}

test('student registration page exposes active periods and active groups for selection', function () {
    ['user' => $user] = createStudentUser();

    $period = Periode::factory()->active()->create([
        'name' => 'KKN Reguler 2026',
    ]);

    $location = Lokasi::factory()->create([
        'village_name' => 'Desa Karangsari',
        'district_name' => 'Kecamatan Kembaran',
        'regency_name' => 'Kabupaten Banyumas',
    ]);

    $group = KelompokKkn::factory()->create([
        'period_id' => $period->id,
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
        'period_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);

    KelompokKkn::factory()->create([
        'period_id' => $period->id,
        'status' => 'draft',
    ]);

    $this->actingAs($user)
        ->get(route('student.registration.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Register')
            ->has('periods', 1)
            ->where('periods.0.nama', 'KKN Reguler 2026')
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
        'name' => 'KKN Tematik 2026',
    ]);

    $group = KelompokKkn::factory()->create([
        'period_id' => $period->id,
        'status' => 'active',
        'capacity' => 12,
    ]);

    $this->actingAs($user)
        ->get(route('student.registration.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('periods.0.nama', 'KKN Tematik 2026')
            ->where('periods.0.kelompok.0.male_min_required', 3)
            ->where('periods.0.kelompok.0.male_target_maximum', 4)
            ->where('periods.0.kelompok.0.male_min_percentage', 25)
            ->where('periods.0.kelompok.0.male_target_percentage', 35)
        );
});

test('student can submit registration to an active period and active group', function () {
    ['user' => $user, 'student' => $student] = createStudentUser();

    $period = Periode::factory()->active()->create();
    $group = KelompokKkn::factory()->create([
        'period_id' => $period->id,
        'status' => 'active',
    ]);

    $this->actingAs($user)
        ->post(route('student.registration.store'), [
            'period_id' => $period->id,
            'kelompok_id' => $group->id,
            'notes' => 'Siap mengikuti KKN.',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseHas('peserta_kkn', [
        'mahasiswa_id' => $student->id,
        'period_id' => $period->id,
        'kelompok_id' => $group->id,
        'status' => 'pending',
    ], 'kkn');

    $this->assertDatabaseHas('antrian_kkn', [
        'mahasiswa_id' => $student->id,
        'period_id' => $period->id,
        'status' => 'dalam_kelompok',
    ], 'kkn');
});

test('student with approved group registration is redirected away from registration page', function () {
    ['user' => $user, 'student' => $student] = createStudentUser();

    $period = Periode::factory()->active()->create();
    $group = KelompokKkn::factory()->create([
        'period_id' => $period->id,
        'status' => 'active',
    ]);

    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $student->id,
        'period_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);

    $this->actingAs($user)
        ->get(route('student.registration.create'))
        ->assertRedirect(route('student.dashboard'))
        ->assertSessionHas('info');
});

test('student with approved group registration cannot update or leave registration anymore', function () {
    ['user' => $user, 'student' => $student] = createStudentUser();

    $period = Periode::factory()->active()->create();
    $group = KelompokKkn::factory()->create([
        'period_id' => $period->id,
        'status' => 'active',
    ]);

    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $student->id,
        'period_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);

    $this->actingAs($user)
        ->post(route('student.registration.store'), [
            'period_id' => $period->id,
            'kelompok_id' => $group->id,
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
        'period_id' => $period->id,
        'location_id' => $location->id,
        'dpl_id' => $lecturer->id,
        'nama_kelompok' => 'Kelompok Melati',
    ]);

    $group->dosen()->attach($lecturer->id, ['role' => 'Ketua']);

    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $student->id,
        'period_id' => $period->id,
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

test('student cannot take a seat reserved for another faculty', function () {
    $facultyA = Fakultas::factory()->create(['nama' => 'Fakultas Syariah']);
    $programA = Prodi::factory()->create([
        'faculty_id' => $facultyA->id,
        'nama' => 'Hukum Keluarga',
    ]);
    $facultyB = Fakultas::factory()->create(['nama' => 'Fakultas Dakwah']);

    ['user' => $user, 'student' => $student] = createStudentUser([
        'faculty_id' => $facultyA->id,
        'program_id' => $programA->id,
    ]);

    $otherStudent = Mahasiswa::factory()->create([
        'faculty_id' => $facultyA->id,
        'program_id' => $programA->id,
    ]);

    $period = Periode::factory()->active()->create();
    $group = KelompokKkn::factory()->create([
        'period_id' => $period->id,
        'capacity' => 2,
        'status' => 'active',
    ]);

    SlotTerkunci::create([
        'kelompok_id' => $group->id,
        'tipe_slot' => 'fakultas',
        'fakultas_id' => $facultyB->id,
        'kuota_slot' => 1,
    ]);

    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $otherStudent->id,
        'period_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);

    $this->actingAs($user)
        ->from(route('student.registration.create'))
        ->post(route('student.registration.store'), [
            'period_id' => $period->id,
            'kelompok_id' => $group->id,
        ])
        ->assertRedirect(route('student.registration.create'))
        ->assertSessionHasErrors('kelompok_id');

    $this->assertDatabaseHas('peserta_kkn', [
        'mahasiswa_id' => $student->id,
        'period_id' => $period->id,
        'kelompok_id' => null,
        'status' => 'pending',
    ], 'kkn');

    $this->assertDatabaseHas('antrian_kkn', [
        'mahasiswa_id' => $student->id,
        'period_id' => $period->id,
        'status' => 'menunggu',
    ], 'kkn');
});

test('female student cannot take a seat that would break the minimum male ratio requirement', function () {
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
        'period_id' => $period->id,
        'capacity' => 10,
        'status' => 'active',
    ]);

    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $existingMaleStudent->id,
        'period_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);
    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $otherFemaleStudent->id,
        'period_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);
    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $anotherFemaleStudent->id,
        'period_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);
    foreach (range(1, 6) as $_) {
        $femaleStudent = Mahasiswa::factory()->create([
            'gender' => 'P',
        ]);

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $femaleStudent->id,
            'period_id' => $period->id,
            'kelompok_id' => $group->id,
        ]);
    }

    $this->actingAs($user)
        ->from(route('student.registration.create'))
        ->post(route('student.registration.store'), [
            'period_id' => $period->id,
            'kelompok_id' => $group->id,
        ])
        ->assertRedirect(route('student.registration.create'))
        ->assertSessionHasErrors([
            'kelompok_id' => 'Kelompok ini masih harus menyisakan 1 slot untuk mahasiswa laki-laki agar target minimum 20% terpenuhi.',
        ]);

    $this->assertDatabaseHas('peserta_kkn', [
        'mahasiswa_id' => $student->id,
        'period_id' => $period->id,
        'kelompok_id' => null,
        'status' => 'pending',
    ], 'kkn');
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
        'period_id' => $period->id,
        'capacity' => 10,
        'status' => 'active',
    ]);

    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $existingMaleStudent->id,
        'period_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);
    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $otherFemaleStudent->id,
        'period_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);
    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $anotherFemaleStudent->id,
        'period_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);
    foreach (range(1, 6) as $_) {
        $femaleStudent = Mahasiswa::factory()->create([
            'gender' => 'P',
        ]);

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $femaleStudent->id,
            'period_id' => $period->id,
            'kelompok_id' => $group->id,
        ]);
    }

    $this->actingAs($user)
        ->post(route('student.registration.store'), [
            'period_id' => $period->id,
            'kelompok_id' => $group->id,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseHas('peserta_kkn', [
        'mahasiswa_id' => $student->id,
        'period_id' => $period->id,
        'kelompok_id' => $group->id,
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
        'period_id' => $period->id,
        'capacity' => 10,
        'status' => 'active',
    ]);

    PesertaKkn::factory()->count(3)->approved()->create([
        'period_id' => $period->id,
        'kelompok_id' => $group->id,
    ]);
    PesertaKkn::factory()->count(6)->approved()->create([
        'period_id' => $period->id,
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
            'period_id' => $period->id,
            'kelompok_id' => $group->id,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseHas('peserta_kkn', [
        'mahasiswa_id' => $student->id,
        'period_id' => $period->id,
        'kelompok_id' => $group->id,
        'status' => 'pending',
    ], 'kkn');
});

test('student with approved registration cannot leave group through registration flow while locked', function () {
    ['user' => $user, 'student' => $student] = createStudentUser();

    $period = Periode::factory()->active()->create([
        'start_date' => now()->addDays(30)->toDateString(),
    ]);

    $group = KelompokKkn::factory()->create([
        'period_id' => $period->id,
        'status' => 'active',
    ]);

    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $student->id,
        'period_id' => $period->id,
        'kelompok_id' => $group->id,
        'joined_group_at' => now()->subHours(2),
        'group_locked_until' => now()->addHours(6),
    ]);

    AntrianKkn::create([
        'mahasiswa_id' => $student->id,
        'period_id' => $period->id,
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
        'period_id' => $period->id,
        'status' => 'active',
    ]);

    PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $student->id,
        'period_id' => $period->id,
        'kelompok_id' => $group->id,
        'joined_group_at' => now()->subDays(2),
        'group_locked_until' => now()->subHour(),
    ]);

    AntrianKkn::create([
        'mahasiswa_id' => $student->id,
        'period_id' => $period->id,
        'status' => 'dalam_kelompok',
        'joined_at' => now()->subDay(),
    ]);

    $this->actingAs($user)
        ->delete(route('student.registration.leave', $period))
        ->assertRedirect(route('student.dashboard'))
        ->assertSessionHas('error');

    $this->assertDatabaseHas('peserta_kkn', [
        'mahasiswa_id' => $student->id,
        'period_id' => $period->id,
        'kelompok_id' => $group->id,
    ], 'kkn');

    $this->assertDatabaseHas('antrian_kkn', [
        'mahasiswa_id' => $student->id,
        'period_id' => $period->id,
        'status' => 'dalam_kelompok',
    ], 'kkn');
});
