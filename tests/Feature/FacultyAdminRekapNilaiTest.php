<?php

namespace Tests\Feature;

use App\Models\KKN\Fakultas;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Prodi;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FacultyAdminRekapNilaiTest extends TestCase
{
    private User $superadmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);

        $this->superadmin = User::factory()->create([
            'username' => 'superadmin',
            'name' => 'Super Admin',
            'email' => 'superadmin@example.test',
        ]);
        $this->superadmin->assignRole('superadmin');
    }

    public function test_superadmin_can_create_faculty_admin_account(): void
    {
        $faculty = Fakultas::factory()->create(['nama' => 'Fakultas Tarbiyah']);

        $response = $this->actingAs($this->superadmin)->post('/admin/pengguna', [
            'username' => 'admin_fak_tarbiyah',
            'name' => 'Admin Fakultas Tarbiyah',
            'email' => 'admin-fakultas@example.test',
            'password' => 'Password#123',
            'role' => 'faculty_admin',
            'faculty_id' => $faculty->id,
        ]);

        $response->assertRedirect('/admin/pengguna');

        $user = User::where('username', 'admin_fak_tarbiyah')->firstOrFail();

        $this->assertSame($faculty->id, $user->faculty_id);
        $this->assertTrue($user->hasRole('faculty_admin'));
    }

    public function test_faculty_admin_only_sees_scores_from_own_faculty(): void
    {
        $facultyA = Fakultas::factory()->create(['nama' => 'Fakultas Dakwah']);
        $facultyB = Fakultas::factory()->create(['nama' => 'Fakultas Syariah']);
        $programA = Prodi::factory()->create(['faculty_id' => $facultyA->id, 'nama' => 'Komunikasi']);
        $programB = Prodi::factory()->create(['faculty_id' => $facultyB->id, 'nama' => 'Hukum']);
        $period = Periode::factory()->create(['name' => 'KKN 2026']);

        $this->createScoreRecord($facultyA, $programA, $period, 'Mahasiswa Dakwah', '240001');
        $otherScore = $this->createScoreRecord($facultyB, $programB, $period, 'Mahasiswa Syariah', '240002');

        $facultyAdmin = User::factory()->create([
            'username' => 'admin_fakultas',
            'faculty_id' => $facultyA->id,
        ]);
        $facultyAdmin->assignRole('faculty_admin');

        $response = $this->actingAs($facultyAdmin)->get(route('admin.rekap-nilai.index', [
            'period_id' => $period->id,
            'faculty_id' => $facultyB->id,
        ]));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/GradeReports/Index')
                ->where('lockedFaculty.id', $facultyA->id)
                ->where('lockedFaculty.name', $facultyA->nama)
                ->where('canExport', false)
                ->where('canBulkCertificates', false)
                ->where('canFinalizeMass', false)
                ->has('scores', 1)
                ->where('scores.0.name', 'Mahasiswa Dakwah')
                ->where('scores.0.fakultas', $facultyA->nama)
            );

        $this->assertDatabaseHas('nilai_kkn', ['id' => $otherScore->id]);
    }

    public function test_faculty_admin_cannot_export_or_finalize_scores(): void
    {
        $faculty = Fakultas::factory()->create(['nama' => 'Fakultas Ushuluddin']);
        $program = Prodi::factory()->create(['faculty_id' => $faculty->id, 'nama' => 'Aqidah']);
        $period = Periode::factory()->create(['name' => 'KKN 2025']);
        $score = $this->createScoreRecord($faculty, $program, $period, 'Mahasiswa Ushuluddin', '240003');

        $facultyAdmin = User::factory()->create([
            'username' => 'faculty_viewer',
            'faculty_id' => $faculty->id,
        ]);
        $facultyAdmin->assignRole('faculty_admin');

        $this->actingAs($facultyAdmin)
            ->get('/admin/rekap-nilai/ekspor?period_id=' . $period->id)
            ->assertForbidden();

        $this->actingAs($facultyAdmin)
            ->patch('/admin/rekap-nilai/' . $score->id . '/finalisasi')
            ->assertForbidden();
    }

    public function test_faculty_admin_dashboard_redirects_to_rekap_nilai(): void
    {
        $faculty = Fakultas::factory()->create();

        $facultyAdmin = User::factory()->create([
            'username' => 'faculty_redirect',
            'faculty_id' => $faculty->id,
        ]);
        $facultyAdmin->assignRole('faculty_admin');

        $this->actingAs($facultyAdmin)
            ->get(route('dashboard'))
            ->assertRedirect('/admin/rekap-nilai');
    }

    public function test_superadmin_can_export_rekap_using_active_period_when_filter_is_omitted(): void
    {
        $faculty = Fakultas::factory()->create(['nama' => 'Fakultas Ekspor']);
        $program = Prodi::factory()->create(['faculty_id' => $faculty->id, 'nama' => 'Ekspor Data']);
        $period = Periode::factory()->active()->create(['name' => 'Periode Ekspor Aktif']);

        $this->createScoreRecord($faculty, $program, $period, 'Mahasiswa Ekspor', '240099');

        $this->actingAs($this->superadmin)
            ->get('/admin/rekap-nilai/ekspor')
            ->assertOk()
            ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    public function test_superadmin_can_export_ledger_using_active_period_when_filter_is_omitted(): void
    {
        $faculty = Fakultas::factory()->create(['nama' => 'Fakultas Ledger']);
        $program = Prodi::factory()->create(['faculty_id' => $faculty->id, 'nama' => 'Ledger Data']);
        $period = Periode::factory()->active()->create(['name' => 'Periode Ledger Aktif']);

        $this->createScoreRecord($faculty, $program, $period, 'Mahasiswa Ledger', '240199');

        $this->actingAs($this->superadmin)
            ->get('/admin/rekap-nilai/ekspor-ledger')
            ->assertOk()
            ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    private function createScoreRecord(
        Fakultas $faculty,
        Prodi $program,
        Periode $period,
        string $studentName,
        string $nim,
    ): NilaiKkn {
        $studentUser = User::factory()->create([
            'name' => $studentName,
            'email' => strtolower(str_replace(' ', '.', $studentName)) . '@example.test',
        ]);
        $studentUser->assignRole('student');

        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $studentUser->id,
            'nama' => $studentName,
            'nim' => $nim,
            'faculty_id' => $faculty->id,
            'program_id' => $program->id,
        ]);

        $group = KelompokKkn::factory()->create([
            'period_id' => $period->id,
        ]);

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'period_id' => $period->id,
            'kelompok_id' => $group->id,
        ]);

        return NilaiKkn::create([
            'user_id' => $studentUser->id,
            'kelompok_id' => $group->id,
            'final_report_score' => 88,
            'execution_score' => 84,
            'article_score' => 86,
            'discipline_score' => 90,
            'attitude_score' => 91,
            'workshop_score' => 87,
            'administration_score' => 89,
            'dpl_weighted_score' => 86.0,
            'village_weighted_score' => 90.5,
            'lppm_weighted_score' => 88.0,
            'total_score' => 87.9,
            'letter_grade' => 'A',
            'dpl_graded_at' => now(),
            'village_graded_at' => now(),
            'admin_graded_at' => now(),
            'is_finalized' => false,
        ]);
    }
}
