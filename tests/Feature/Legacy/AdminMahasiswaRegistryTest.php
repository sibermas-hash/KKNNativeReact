<?php

namespace Tests\Feature;

use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Prodi;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminMahasiswaRegistryTest extends TestCase
{
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);

        $this->admin = User::factory()->create([
            'username' => 'superadmin_registry',
            'name' => 'Superadmin Registry',
            'email' => 'superadmin-registry@example.test',
        ]);
        $this->admin->assignRole('superadmin');
    }

    public function test_registry_reads_from_master_mahasiswa_even_if_user_is_not_role_student(): void
    {
        $faculty = Fakultas::factory()->create(['nama' => 'Fakultas Tarbiyah']);
        $program = Prodi::factory()->create([
            'fakultas_id' => $faculty->id,
            'nama' => 'Pendidikan Agama Islam',
        ]);

        $studentUser = User::factory()->create([
            'username' => 'mahasiswa_akun',
            'name' => 'Mahasiswa Dengan Akun',
            'email' => 'mahasiswa-akun@example.test',
            'is_active' => true,
            'address' => 'Jl. Veteran No. 10, Purwokerto',
        ]);
        $studentUser->assignRole('student');

        Mahasiswa::factory()->create([
            'user_id' => $studentUser->id,
            'nim' => '24010001',
            'nik' => '3301010101010001',
            'nama' => 'Mahasiswa Dengan Akun',
            'mother_name' => 'Siti Aminah',
            'fakultas_id' => $faculty->id,
            'prodi_id' => $program->id,
            'batch_year' => 2024,
            'gender' => 'L',
            'master_id' => 1001,
            'master_synced_at' => Carbon::parse('2026-04-05 08:00:00'),
        ]);

        $masterLinkedUser = User::factory()->create([
            'username' => 'mahasiswa_master',
            'name' => 'Mahasiswa Master Tetap Muncul',
            'email' => 'mahasiswa-master@example.test',
            'is_active' => true,
            'address' => 'Desa Karangsari, Banyumas',
        ]);

        Mahasiswa::factory()->create([
            'user_id' => $masterLinkedUser->id,
            'nim' => '24010002',
            'nik' => '3301010101010002',
            'nama' => 'Mahasiswa Master Tetap Muncul',
            'mother_name' => 'Nur Hidayah',
            'fakultas_id' => $faculty->id,
            'prodi_id' => $program->id,
            'batch_year' => 2025,
            'gender' => 'P',
            'master_id' => 1002,
            'master_synced_at' => Carbon::parse('2026-04-04 08:00:00'),
        ]);

        $this->actingAs($this->admin)
            ->get('/admin/mahasiswa')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/System/Users/MahasiswaIndex')
                ->where('stats.total', 2)
                ->where('stats.with_account', 2)
                ->where('stats.synced', 2)
                ->has('students.data', 2)
                ->where('students.data.0.nim', '24010001')
                ->where('students.data.0.nik', '3301010101010001')
                ->where('students.data.0.mother_name', 'Siti Aminah')
                ->where('students.data.0.address', 'Jl. Veteran No. 10, Purwokerto')
                ->where('students.data.0.has_account', true)
                ->where('students.data.0.account.username', 'mahasiswa_akun')
                ->where('students.data.1.nim', '24010002')
                ->where('students.data.1.nik', '3301010101010002')
                ->where('students.data.1.mother_name', 'Nur Hidayah')
                ->where('students.data.1.address', 'Desa Karangsari, Banyumas')
                ->where('students.data.1.has_account', true)
                ->where('students.data.1.account.username', 'mahasiswa_master')
                ->has('filters')
                ->has('faculties', 1)
                ->has('programs', 1)
            );
    }

    public function test_registry_can_filter_locked_student_accounts(): void
    {
        $faculty = Fakultas::factory()->create(['nama' => 'Fakultas Dakwah']);
        $program = Prodi::factory()->create([
            'fakultas_id' => $faculty->id,
            'nama' => 'Komunikasi Penyiaran Islam',
        ]);

        $studentUser = User::factory()->create([
            'username' => 'mahasiswa_filter',
            'name' => 'Mahasiswa Filter',
            'email' => 'mahasiswa-filter@example.test',
            'is_active' => false,
            'address' => 'Jl. KH Wahid Hasyim No. 5',
        ]);
        $studentUser->assignRole('student');

        Mahasiswa::factory()->create([
            'user_id' => $studentUser->id,
            'nim' => '24020001',
            'nik' => '3302010101010001',
            'nama' => 'Mahasiswa Filter',
            'mother_name' => 'Rohani',
            'fakultas_id' => $faculty->id,
            'prodi_id' => $program->id,
            'master_synced_at' => Carbon::parse('2026-04-03 10:00:00'),
        ]);

        $otherUser = User::factory()->create([
            'username' => 'mahasiswa_aktif',
            'name' => 'Mahasiswa Aktif',
            'email' => 'mahasiswa-aktif@example.test',
            'is_active' => true,
        ]);
        $otherUser->assignRole('student');

        Mahasiswa::factory()->create([
            'user_id' => $otherUser->id,
            'nim' => '24020002',
            'nik' => '3302010101010002',
            'nama' => 'Mahasiswa Aktif',
            'mother_name' => 'Maryam',
            'fakultas_id' => $faculty->id,
            'prodi_id' => $program->id,
            'master_synced_at' => Carbon::parse('2026-04-04 10:00:00'),
        ]);

        $this->actingAs($this->admin)
            ->get('/admin/mahasiswa?account_status=locked')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/System/Users/MahasiswaIndex')
                ->where('filters.account_status', 'locked')
                ->has('students.data', 1)
                ->where('students.data.0.nim', '24020001')
                ->where('students.data.0.has_account', true)
                ->where('students.data.0.account.is_active', false)
            );
    }
}
