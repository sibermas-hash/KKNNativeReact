<?php

namespace Tests\Feature;

use App\Models\KKN\Dosen;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Laporan;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminReportsPageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_superadmin_can_open_admin_reports_page(): void
    {
        $superadmin = User::factory()->create([
            'username' => 'superadmin_reports',
            'email' => 'superadmin-reports@example.test',
        ]);
        $superadmin->assignRole('superadmin');

        $group = KelompokKkn::factory()->create([
            'nama_kelompok' => 'Kelompok Melati',
        ]);
        $student = User::factory()->create([
            'name' => 'Mahasiswa Laporan',
            'email' => 'mahasiswa-laporan@example.test',
        ]);

        Laporan::create([
            'user_id' => $student->id,
            'kelompok_id' => $group->id,
            'type' => 'final_report',
            'title' => 'Laporan Akhir Kelompok Melati',
            'file_path' => 'reports/final/melati.pdf',
            'file_name' => 'melati.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $this->actingAs($superadmin)
            ->get(route('admin.reports.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Reports/Index')
                ->where('summary.total_reports', 1)
                ->where('summary.pending_review', 1)
                ->has('reports.data', 1)
                ->where('reports.data.0.title', 'Laporan Akhir Kelompok Melati')
                ->where('reports.data.0.user.name', 'Mahasiswa Laporan')
                ->where('reports.data.0.group.name', 'Kelompok Melati')
            );
    }

    public function test_dpl_only_sees_reports_from_assigned_groups(): void
    {
        $dplUser = User::factory()->create([
            'username' => 'dpl_reports',
            'email' => 'dpl-reports@example.test',
        ]);
        $dplUser->assignRole('dpl');

        $dosen = Dosen::factory()->create([
            'user_id' => $dplUser->id,
        ]);

        $assignedGroup = KelompokKkn::factory()->create([
            'nama_kelompok' => 'Kelompok Anggrek',
        ]);
        $otherGroup = KelompokKkn::factory()->create([
            'nama_kelompok' => 'Kelompok Mawar',
        ]);

        $dosen->kelompokKkn()->attach($assignedGroup->id, ['role' => 'Ketua']);

        $studentA = User::factory()->create(['name' => 'Mahasiswa Anggrek']);
        $studentB = User::factory()->create(['name' => 'Mahasiswa Mawar']);

        Laporan::create([
            'user_id' => $studentA->id,
            'kelompok_id' => $assignedGroup->id,
            'type' => 'photo_documentation',
            'title' => 'Dokumentasi Anggrek',
            'file_path' => 'reports/photo/anggrek.jpg',
            'file_name' => 'anggrek.jpg',
            'mime_type' => 'image/jpeg',
            'file_size' => 2048,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        Laporan::create([
            'user_id' => $studentB->id,
            'kelompok_id' => $otherGroup->id,
            'type' => 'photo_documentation',
            'title' => 'Dokumentasi Mawar',
            'file_path' => 'reports/photo/mawar.jpg',
            'file_name' => 'mawar.jpg',
            'mime_type' => 'image/jpeg',
            'file_size' => 2048,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $this->actingAs($dplUser)
            ->get(route('admin.reports.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Reports/Index')
                ->where('summary.total_reports', 1)
                ->where('summary.pending_review', 1)
                ->has('reports.data', 1)
                ->where('reports.data.0.title', 'Dokumentasi Anggrek')
                ->where('reports.data.0.group.name', 'Kelompok Anggrek')
            );
    }
}
