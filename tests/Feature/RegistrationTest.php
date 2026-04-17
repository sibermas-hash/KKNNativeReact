<?php

namespace Tests\Feature;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_student_can_open_registration_page_for_active_period(): void
    {
        $user = User::factory()->create([
            'phone' => '081111111111',
            'address' => 'Jl. Pahlawan No. 1',
            'domicile_village_name' => 'Desa Asal',
            'domicile_district_name' => 'Kecamatan Asal',
            'domicile_regency_name' => 'Kabupaten Asal',
            'address_verified_at' => now(),
        ]);
        $user->assignRole('student');

        Mahasiswa::factory()->create([
            'user_id' => $user->id,
            'nik' => '3301010101010011',
            'mother_name' => 'Siti Salamah',
            'birth_place' => 'Purwokerto',
            'birth_date' => '2003-01-11',
            'gender' => 'L',
            'shirt_size' => 'L',
            'sks_completed' => 110,
            'sks_completed' => 110,
            'health_certificate_path' => 'files/health.pdf',
            'parent_permission_path' => 'files/parent.pdf',
        ]);

        Periode::factory()->active()->create();

        $response = $this->actingAs($user)
            ->get(route('student.registration.create'));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Student/Register')
                ->has('periods')
                ->where('domicile_profile.is_complete', true)
            );
    }

    public function test_student_can_register_for_active_period(): void
    {
        $user = User::factory()->create([
            'phone' => '081222222222',
            'address' => 'Jl. Pahlawan No. 2',
            'domicile_village_name' => 'Desa Asal',
            'domicile_district_name' => 'Kecamatan Asal',
            'domicile_regency_name' => 'Kabupaten Asal',
            'address_verified_at' => now(),
        ]);
        $user->assignRole('student');

        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $user->id,
            'nik' => '3301010101010012',
            'mother_name' => 'Nur Hidayah',
            'birth_place' => 'Cilacap',
            'birth_date' => '2003-02-12',
            'gender' => 'L',
            'shirt_size' => 'L',
            'sks_completed' => 110,
        ]);

        $period = Periode::factory()->active()->create();
        $group = KelompokKkn::factory()->create([
            'period_id' => $period->id,
            'status' => 'active',
            'location_id' => Lokasi::factory()->create([
                'village_name' => 'Desa Penempatan',
                'district_name' => 'Kecamatan Penempatan',
                'regency_name' => 'Kabupaten Penempatan',
            ])->id,
        ]);

        // First visit the registration page to establish session
        $this->actingAs($user)
            ->get(route('student.registration.create'));

        $response = $this->actingAs($user)
            ->from(route('student.registration.create'))
            ->post(route('student.registration.store'), [
                'period_id' => $period->id,
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('peserta_kkn', [
            'mahasiswa_id' => $mahasiswa->id,
            'period_id' => $period->id,
            'status' => 'pending',
        ], 'kkn');
    }

    public function test_student_cannot_register_twice_for_the_same_period(): void
    {
        $user = User::factory()->create([
            'phone' => '081333333333',
            'address' => 'Jl. Pahlawan No. 3',
            'domicile_village_name' => 'Desa Asal',
            'domicile_district_name' => 'Kecamatan Asal',
            'domicile_regency_name' => 'Kabupaten Asal',
            'address_verified_at' => now(),
        ]);
        $user->assignRole('student');

        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $user->id,
            'nik' => '3301010101010013',
            'mother_name' => 'Khadijah',
            'birth_place' => 'Purbalingga',
            'birth_date' => '2003-03-13',
            'gender' => 'L',
            'shirt_size' => 'L',
            'sks_completed' => 110,
        ]);

        $period = Periode::factory()->active()->create();
        $group = KelompokKkn::factory()->create([
            'period_id' => $period->id,
            'status' => 'active',
            'location_id' => Lokasi::factory()->create([
                'village_name' => 'Desa Penempatan',
                'district_name' => 'Kecamatan Penempatan',
                'regency_name' => 'Kabupaten Penempatan',
            ])->id,
        ]);

        // First registration
        $this->actingAs($user)
            ->get(route('student.registration.create'));

        $this->actingAs($user)
            ->post(route('student.registration.store'), [
                'period_id' => $period->id,
            ]);

        // Attempt duplicate registration
        $response = $this->actingAs($user)
            ->from(route('student.registration.create'))
            ->post(route('student.registration.store'), [
                'period_id' => $period->id,
            ]);

        // Should only have one registration record
        $count = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->where('period_id', $period->id)
            ->count();

        $this->assertSame(1, $count);
    }

    public function test_student_is_redirected_to_profile_when_bpjs_biodata_is_incomplete(): void
    {
        $user = User::factory()->create([
            'phone' => '081234567890',
            'address' => null,
        ]);
        $user->assignRole('student');

        Mahasiswa::factory()->create([
            'user_id' => $user->id,
            'nama' => 'Test Student',
            'gender' => 'L',
            'health_certificate_path' => 'files/health.pdf',
            'parent_permission_path' => 'files/parent.pdf',
            'nik' => null,
            'mother_name' => null,
            'birth_place' => null,
            'birth_date' => null,
            'sks_completed' => 110,
        ]);

        $period = Periode::factory()->active()->create();

        // Visit registration page first to establish session
        $this->actingAs($user)
            ->get(route('student.registration.create'));

        $response = $this->actingAs($user)
            ->post(route('student.registration.store'), [
                'period_id' => $period->id,
            ]);

        $response
            ->assertRedirect(route('profile.show'))
            ->assertSessionHas('error');
    }

    public function test_guest_cannot_access_registration_page(): void
    {
        Periode::factory()->active()->create();

        $response = $this->get(route('student.registration.create'));

        $response->assertRedirect(route('login'));
    }

    public function test_student_is_redirected_to_profile_when_domicile_is_not_verified(): void
    {
        $user = User::factory()->create([
            'phone' => '081444444444',
            'address' => 'Jl. Pahlawan No. 4',
            'domicile_village_name' => 'Desa Asal',
            'domicile_district_name' => 'Kecamatan Asal',
            'domicile_regency_name' => 'Kabupaten Asal',
            'address_verified_at' => null,
        ]);
        $user->assignRole('student');

        Mahasiswa::factory()->create([
            'user_id' => $user->id,
            'nama' => 'Test Student',
            'gender' => 'L',
            'health_certificate_path' => 'files/health.pdf',
            'parent_permission_path' => 'files/parent.pdf',
            'nik' => '3301010101010014',
            'mother_name' => 'Maryam',
            'birth_place' => 'Banjarnegara',
            'birth_date' => '2003-04-14',
            'sks_completed' => 110,
        ]);

        $period = Periode::factory()->active()->create();
        KelompokKkn::factory()->create([
            'period_id' => $period->id,
            'status' => 'active',
            'location_id' => Lokasi::factory()->create([
                'village_name' => 'Desa Penempatan',
                'district_name' => 'Kecamatan Penempatan',
                'regency_name' => 'Kabupaten Penempatan',
            ])->id,
        ]);

        $response = $this->actingAs($user)
            ->post(route('student.registration.store'), [
                'period_id' => $period->id,
            ]);

        $response
            ->assertRedirect(route('profile.show'))
            ->assertSessionHas('error');
    }
}
