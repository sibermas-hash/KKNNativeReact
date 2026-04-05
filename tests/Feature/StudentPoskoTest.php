<?php

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\PoskoKelompok;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
});

function createApprovedStudentContext(string $role = 'Anggota'): array
{
    $user = User::factory()->create();
    $user->assignRole('student');

    $student = Mahasiswa::factory()->create([
        'user_id' => $user->id,
    ]);

    $location = Lokasi::factory()->create([
        'village_name' => 'Desa Karangsari',
        'district_name' => 'Kecamatan Kembaran',
        'regency_name' => 'Kabupaten Banyumas',
    ]);

    $group = KelompokKkn::factory()->create([
        'location_id' => $location->id,
    ]);

    $registration = PesertaKkn::factory()->approved()->create([
        'mahasiswa_id' => $student->id,
        'period_id' => $group->period_id,
        'kelompok_id' => $group->id,
        'role' => $role,
    ]);

    return compact('user', 'student', 'location', 'group', 'registration');
}

test('approved student can open the posko page for their assigned group', function () {
    ['user' => $user] = createApprovedStudentContext();

    $this->actingAs($user)
        ->get(route('student.posko.edit'))
        ->assertOk();
});

test('approved group leader can upload group posko coordinates and photo', function () {
    Storage::fake('local');
    Http::fake([
        'nominatim.openstreetmap.org/*' => Http::response([
            'address' => [
                'village' => 'Desa Karangsari',
                'city_district' => 'Kecamatan Kembaran',
                'regency' => 'Kabupaten Banyumas',
            ],
        ], 200),
    ]);

    ['user' => $user, 'group' => $group] = createApprovedStudentContext('Ketua');

    $this->actingAs($user)
        ->post(route('student.posko.store'), [
            'latitude' => '-7.3587905',
            'longitude' => '109.9030928',
            'gmaps_link' => 'https://maps.google.com/?q=-7.3587905,109.9030928',
            'photo' => UploadedFile::fake()->image('posko.jpg', 1200, 800),
        ])
        ->assertRedirect(route('student.posko.edit'))
        ->assertSessionHas('success');

    $posko = PoskoKelompok::where('kelompok_id', $group->id)->first();

    expect($posko)->not->toBeNull()
        ->and((float) $posko->latitude)->toBe(-7.3587905)
        ->and((float) $posko->longitude)->toBe(109.9030928)
        ->and($posko->gmaps_link)->toBe('https://maps.google.com/?q=-7.3587905,109.9030928')
        ->and($posko->uploaded_by)->toBe($user->id)
        ->and($posko->photo_name)->toBe('posko.jpg');

    Storage::disk('local')->assertExists($posko->photo_path);
});

test('approved group leader cannot save gmaps link with mismatched coordinates', function () {
    Storage::fake('local');

    ['user' => $user, 'group' => $group] = createApprovedStudentContext('Ketua');

    $this->actingAs($user)
        ->from(route('student.posko.edit'))
        ->post(route('student.posko.store'), [
            'latitude' => '-7.3587905',
            'longitude' => '109.9030928',
            'gmaps_link' => 'https://maps.google.com/?q=-7.111111,109.222222',
            'photo' => UploadedFile::fake()->image('posko.jpg', 1200, 800),
        ])
        ->assertRedirect(route('student.posko.edit'))
        ->assertSessionHasErrors('gmaps_link');

    expect(PoskoKelompok::where('kelompok_id', $group->id)->exists())->toBeFalse();
});

test('approved group leader cannot save gmaps link outside assigned village area', function () {
    Storage::fake('local');
    Http::fake([
        'nominatim.openstreetmap.org/*' => Http::response([
            'address' => [
                'village' => 'Desa Lain',
                'city_district' => 'Kecamatan Lain',
                'regency' => 'Kabupaten Lain',
            ],
        ], 200),
    ]);

    ['user' => $user, 'group' => $group] = createApprovedStudentContext('Ketua');

    $this->actingAs($user)
        ->from(route('student.posko.edit'))
        ->post(route('student.posko.store'), [
            'latitude' => '-7.3587905',
            'longitude' => '109.9030928',
            'gmaps_link' => 'https://maps.google.com/?q=-7.3587905,109.9030928',
            'photo' => UploadedFile::fake()->image('posko.jpg', 1200, 800),
        ])
        ->assertRedirect(route('student.posko.edit'))
        ->assertSessionHasErrors('gmaps_link');

    expect(PoskoKelompok::where('kelompok_id', $group->id)->exists())->toBeFalse();
});

test('approved student can access the stored posko photo through the protected route', function () {
    Storage::fake('local');

    ['user' => $user, 'group' => $group] = createApprovedStudentContext('Ketua');

    $this->actingAs($user)
        ->post(route('student.posko.store'), [
            'latitude' => '-7.3587905',
            'longitude' => '109.9030928',
            'photo' => UploadedFile::fake()->image('posko.jpg', 1200, 800),
        ])
        ->assertRedirect(route('student.posko.edit'));

    $posko = PoskoKelompok::where('kelompok_id', $group->id)->firstOrFail();

    $this->actingAs($user)
        ->get(route('posko.photo', $posko))
        ->assertOk();
});

test('student without an approved group assignment cannot access posko management', function () {
    $user = User::factory()->create();
    $user->assignRole('student');

    Mahasiswa::factory()->create([
        'user_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->get(route('student.posko.edit'))
        ->assertForbidden();
});
