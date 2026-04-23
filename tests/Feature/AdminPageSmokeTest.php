<?php

namespace Tests\Feature;

use App\Models\KKN\Fakultas;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminPageSmokeTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        foreach (['superadmin', 'admin', 'faculty_admin'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }
    }

    public function test_superadmin_can_open_all_primary_admin_pages(): void
    {
        $user = User::factory()->create();
        $user->assignRole('superadmin');

        $paths = [
            '/admin',
            '/admin/pendaftaran',
            '/admin/kelompok',
            '/admin/nilai',
            '/admin/rekapitulasi',
            '/admin/laporan/harian',
            '/admin/laporan/program-kerja',
            '/admin/laporan/akhir',
            '/admin/evaluasi',
            '/admin/periode',
            '/admin/tahun-akademik',
            '/admin/jenis-kkn',
            '/admin/fakultas',
            '/admin/prodi',
            '/admin/kkn-requirements',
            '/admin/lokasi',
            '/admin/pengguna',
            '/admin/pengguna/buat',
            '/admin/mahasiswa',
            '/admin/mahasiswa/sinkron',
            '/admin/dosen',
            '/admin/dosen/sinkron',
            '/admin/dosen/penugasan',
            '/admin/konfigurasi-penilaian',
            '/admin/pengaturan/sertifikat',
            '/admin/pengaturan/sistem',
            '/admin/audit-log',
            '/admin/laporan',
            '/admin/generator-nilai',
            '/admin/unduhan',
            '/admin/unduhan/create',
            '/admin/yudisium',
            '/admin/warta-utama',
            '/admin/konten-publik/profil',
            '/admin/konten-publik/skema',
            // Legacy compatibility aliases that still need to stay alive.
            '/admin/periods',
            '/admin/locations',
            '/admin/grade-reports',
            '/admin/reports',
            '/admin/dpl/assignment',
            '/admin/dpl/sync',
        ];

        foreach ($paths as $path) {
            $response = $this->actingAs($user)->get($path);
            if ($response->isRedirect()) {
                $response = $this->followRedirects($response);
            }
            $this->assertSame(200, $response->status(), "Superadmin gagal membuka {$path}");
        }
    }

    public function test_admin_role_can_open_shared_admin_operational_pages(): void
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        $paths = [
            '/admin',
            '/admin/pendaftaran',
            '/admin/kelompok',
            '/admin/nilai',
            '/admin/rekapitulasi',
            '/admin/laporan/harian',
            '/admin/laporan/program-kerja',
            '/admin/laporan/akhir',
            '/admin/evaluasi',
            '/admin/laporan',
            '/admin/reports',
            '/admin/generator-nilai',
        ];

        foreach ($paths as $path) {
            $response = $this->actingAs($user)->get($path);
            if ($response->isRedirect()) {
                $response = $this->followRedirects($response);
            }
            $this->assertSame(200, $response->status(), "Admin gagal membuka {$path}");
        }
    }

    public function test_faculty_admin_can_open_faculty_scoped_admin_pages(): void
    {
        $faculty = Fakultas::factory()->create();
        $user = User::factory()->create([
            'fakultas_id' => $faculty->id,
        ]);
        $user->assignRole('faculty_admin');

        $paths = [
            '/admin',
            '/admin/pendaftaran',
            '/admin/rekapitulasi',
        ];

        foreach ($paths as $path) {
            $response = $this->actingAs($user)->get($path);
            if ($response->isRedirect()) {
                $response = $this->followRedirects($response);
            }
            $this->assertSame(200, $response->status(), "Faculty admin gagal membuka {$path}");
        }
    }
}
