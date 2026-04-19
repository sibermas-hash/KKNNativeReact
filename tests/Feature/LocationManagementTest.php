<?php

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
});

function actingAsLocationAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('superadmin');

    test()->actingAs($user);

    return $user;
}

test('superadmin can import administrative locations from csv', function () {
    actingAsLocationAdmin();

    $file = UploadedFile::fake()->createWithContent('locations.csv', implode("\n", [
        'desa,kecamatan,kabupaten,kode_desa',
        'Desa Karangsari,Kecamatan Kembaran,Kabupaten Banyumas,3302010001',
        'Desa Sumbang,Kecamatan Sumbang,Kabupaten Banyumas,3302020002',
    ]));

    $this->post(route('admin.lokasi.import'), [
        'file' => $file,
    ])->assertRedirect();

    expect(Lokasi::count())->toBe(2);

    $this->assertDatabaseHas('lokasi', [
        'village_name' => 'Desa Karangsari',
        'district_name' => 'Kecamatan Kembaran',
        'regency_name' => 'Kabupaten Banyumas',
        'village_code' => '3302010001',
    ]);
});

test('import updates an existing administrative location instead of duplicating it', function () {
    actingAsLocationAdmin();

    $location = Lokasi::factory()->create([
        'village_name' => 'Desa Karangsari',
        'district_name' => 'Kecamatan Kembaran',
        'regency_name' => 'Kabupaten Banyumas',
        'village_code' => null,
    ]);

    $file = UploadedFile::fake()->createWithContent('locations.csv', implode("\n", [
        'desa,kecamatan,kabupaten,kode_desa',
        'Desa Karangsari,Kecamatan Kembaran,Kabupaten Banyumas,3302010001',
    ]));

    $this->post(route('admin.lokasi.import'), [
        'file' => $file,
    ])->assertRedirect();

    $location->refresh();

    expect(Lokasi::count())->toBe(1)
        ->and($location->village_code)->toBe('3302010001');
});

test('superadmin cannot delete a location that is already assigned to a group', function () {
    actingAsLocationAdmin();

    $location = Lokasi::factory()->create();
    KelompokKkn::factory()->create([
        'location_id' => $location->id,
    ]);

    $this->delete(route('admin.lokasi.destroy', ['lokasi' => $location->id]))
        ->assertRedirect()
        ->assertSessionHas('error');

    expect(Lokasi::find($location->id))->not->toBeNull();
});

test('superadmin can delete an unused administrative location', function () {
    actingAsLocationAdmin();

    $location = Lokasi::factory()->create();

    $this->delete(route('admin.lokasi.destroy', ['lokasi' => $location->id]))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(Lokasi::find($location->id))->toBeNull();
});
