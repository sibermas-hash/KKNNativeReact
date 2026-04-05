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
                ->where('student.bpjs_complete', true)
            );
    }

    public function test_student_can_update_bpjs_biodata_and_contact_information(): void
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
            ->put(route('profile.update'), [
                'name' => 'Mahasiswa Update BPJS',
                'phone' => '081355577799',
                'address' => 'Jl. Jenderal Soedirman No. 88',
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
        ], 'kkn');

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
