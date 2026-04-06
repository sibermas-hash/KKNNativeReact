<?php

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Periode;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
});

function actingAsGroupImportAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('superadmin');

    test()->actingAs($user);

    return $user;
}

test('superadmin can import groups and automatically create locations from the same file', function () {
    actingAsGroupImportAdmin();

    $period = Periode::factory()->active()->create([
        'name' => 'Periode Import 2026',
    ]);

    $file = UploadedFile::fake()->createWithContent('groups.csv', implode("\n", [
        'kode_kelompok,nama_kelompok,periode,desa,kecamatan,kabupaten,kapasitas,status',
        "KKN-A1,Kelompok A1,{$period->name},Desa A,Kecamatan A,Kabupaten A,12,active",
    ]));

    $this->post(route('admin.kelompok.import'), [
        'file' => $file,
    ])->assertRedirect()->assertSessionHas('success');

    $this->assertDatabaseHas('lokasi', [
        'village_name' => 'Desa A',
        'district_name' => 'Kecamatan A',
        'regency_name' => 'Kabupaten A',
    ], 'kkn');

    $this->assertDatabaseHas('kelompok_kkn', [
        'period_id' => $period->id,
        'code' => 'KKN-A1',
        'nama_kelompok' => 'Kelompok A1',
    ], 'kkn');
});

test('superadmin import groups updates matching location data when available', function () {
    actingAsGroupImportAdmin();

    $period = Periode::factory()->active()->create([
        'name' => 'Periode Import 2026',
    ]);

    Lokasi::factory()->create([
        'village_name' => 'Desa A',
        'district_name' => 'Kecamatan A',
        'regency_name' => 'Kabupaten A',
        'village_code' => null,
    ]);

    $file = UploadedFile::fake()->createWithContent('groups.csv', implode("\n", [
        'kode_kelompok,nama_kelompok,periode,desa,kecamatan,kabupaten,kode_desa,kapasitas,status',
        "KKN-A1,Kelompok A1,{$period->name},Desa A,Kecamatan A,Kabupaten A,3302010001,12,active",
    ]));

    $this->post(route('admin.kelompok.import'), [
        'file' => $file,
    ])->assertRedirect()->assertSessionHas('success');

    $this->assertDatabaseHas('kelompok_kkn', [
        'period_id' => $period->id,
        'code' => 'KKN-A1',
        'nama_kelompok' => 'Kelompok A1',
        'capacity' => 12,
        'status' => 'active',
    ], 'kkn');

    $this->assertDatabaseHas('lokasi', [
        'village_name' => 'Desa A',
        'district_name' => 'Kecamatan A',
        'regency_name' => 'Kabupaten A',
        'village_code' => '3302010001',
    ], 'kkn');
});

test('superadmin cannot import dpl assignment before groups exist', function () {
    actingAsGroupImportAdmin();

    $file = UploadedFile::fake()->createWithContent('dpl-assignment.csv', implode("\n", [
        'nip,periode,max_groups',
        '198001012006041001,Periode Import 2026,5',
    ]));

    $this->post(route('admin.dpl.impor'), [
        'file' => $file,
    ])->assertRedirect()->assertSessionHas('error');
});
