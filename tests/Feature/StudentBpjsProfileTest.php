<?php

namespace Tests\Feature;

use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Prodi;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentBpjsProfileTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_student_can_view_bpjs_biodata_section_from_profile_page(): void
    {
        $faculty = Fakultas::factory()->create(['nama' => 'Fakultas Dakwah']);
        $program = Prodi::factory()->create([
            'faculty_id' => $faculty->id,
            'nama' => 'Komunikasi Penyiaran Islam',
        ]);

        $user = User::factory()->create([
            'username' => 'profilbpjs',
            'phone' => '081234567890',
            'address' => 'Jl. Prof. Dr. Soeharso No. 7',
            'domicile_village_name' => 'Desa Sumbang',
            'domicile_district_name' => 'Kecamatan Sumbang',
            'domicile_regency_name' => 'Kabupaten Banyumas',
            'address_verified_at' => now(),
        ]);
        $user->assignRole('student');

        Mahasiswa::factory()->create([
            'user_id' => $user->id,
            'nim' => '24040001',
            'nama' => 'Mahasiswa Profil',
            'nik' => '3304010101010001',
            'mother_name' => 'Ibu Profil',
            'faculty_id' => $faculty->id,
            'program_id' => $program->id,
            'birth_place' => 'Banyumas',
            'birth_date' => '2003-04-01',
            'gender' => 'P',
            'shirt_size' => 'M',
        ]);

        $this->actingAs($user)
            ->get(route('profile.show'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Profile/Show')
                ->where('student.nim', '24040001')
                ->where('student.nik', '3304010101010001')
                ->where('student.mother_name', 'Ibu Profil')
                ->where('student.faculty', 'Fakultas Dakwah')
                ->where('student.program', 'Komunikasi Penyiaran Islam')
                ->where('student.biodata_complete', true)
                ->where('student.domicile_complete', true)
                ->where('student.domicile_verified', true)
            );
    }

    public function test_student_can_update_bpjs_biodata_and_verified_domicile_information(): void
    {
        $user = User::factory()->create([
            'username' => 'updatebpjs',
            'phone' => null,
            'address' => null,
        ]);
        $user->assignRole('student');

        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $user->id,
            'nik' => null,
            'mother_name' => null,
            'birth_place' => null,
            'birth_date' => null,
            'gender' => 'L',
        ]);

        $this->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => 'Mahasiswa Update BPJS',
                'phone' => '081355577799',
                'address' => 'Jl. Jenderal Soedirman No. 88',
                'domicile_village_name' => 'Desa Karangnanas',
                'domicile_district_name' => 'Kecamatan Sokaraja',
                'domicile_regency_name' => 'Kabupaten Banyumas',
                'address_verified' => true,
                'nik' => '3304010101010099',
                'mother_name' => 'Ibu Update',
                'gender' => 'P',
                'birth_place' => 'Purbalingga',
                'birth_date' => '2003-04-09',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Mahasiswa Update BPJS',
            'phone' => '081355577799',
            'address' => 'Jl. Jenderal Soedirman No. 88',
            'domicile_village_name' => 'Desa Karangnanas',
            'domicile_district_name' => 'Kecamatan Sokaraja',
            'domicile_regency_name' => 'Kabupaten Banyumas',
        ], 'kkn');

        $this->assertNotNull($user->fresh()->address_verified_at);

        $this->assertDatabaseHas('mahasiswa', [
            'id' => $mahasiswa->id,
            'nama' => 'Mahasiswa Update BPJS',
            'nik' => '3304010101010099',
            'mother_name' => 'Ibu Update',
            'gender' => 'P',
            'birth_place' => 'Purbalingga',
        ], 'kkn');
    }
}
