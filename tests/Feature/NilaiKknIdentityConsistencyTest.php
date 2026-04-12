<?php

namespace Tests\Feature;

use App\Models\KKN\Fakultas;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Prodi;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NilaiKknIdentityConsistencyTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_nilai_kkn_resolves_mahasiswa_via_user_id_when_primary_keys_diverge(): void
    {
        [$studentUser, $mahasiswa] = $this->createStudentWithDivergedIds();
        $group = KelompokKkn::factory()->create();

        $score = NilaiKkn::factory()->create([
            'user_id' => $studentUser->id,
            'kelompok_id' => $group->id,
        ]);

        $score->refresh();

        $this->assertNotSame($studentUser->id, $mahasiswa->id);
        $this->assertNotNull($score->mahasiswa);
        $this->assertTrue($score->mahasiswa->is($mahasiswa));
    }

    public function test_rekap_and_finalize_work_when_score_uses_user_id_and_report_uses_mahasiswa_id(): void
    {
        Notification::fake();

        $superadmin = User::factory()->create([
            'username' => 'superadmin_nilai',
            'email' => 'superadmin-nilai@example.test',
        ]);
        $superadmin->assignRole('superadmin');

        $faculty = Fakultas::factory()->create(['nama' => 'Fakultas Teknik']);
        $program = Prodi::factory()->create([
            'faculty_id' => $faculty->id,
            'nama' => 'Teknik Informatika',
        ]);
        $period = Periode::factory()->create(['name' => 'KKN 2026']);

        [$studentUser, $mahasiswa] = $this->createStudentWithDivergedIds($faculty, $program, 'Mahasiswa Uji', '240999');

        $group = KelompokKkn::factory()->create([
            'period_id' => $period->id,
        ]);

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'period_id' => $period->id,
            'kelompok_id' => $group->id,
        ]);

        $score = NilaiKkn::create([
            'user_id' => $studentUser->id,
            'kelompok_id' => $group->id,
            'final_report_score' => 88,
            'execution_score' => 86,
            'article_score' => 84,
            'discipline_score' => 90,
            'attitude_score' => 91,
            'workshop_score' => 89,
            'administration_score' => 87,
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

        LaporanAkhir::create([
            'mahasiswa_id' => $mahasiswa->id,
            'kelompok_id' => $group->id,
            'title' => 'Laporan Akhir Mahasiswa Uji',
            'file_path' => 'laporan/uji.pdf',
            'file_name' => 'uji.pdf',
            'status' => 'approved',
            'submitted_at' => now(),
            'reviewed_at' => now(),
            'score' => 90,
        ]);

        $this->actingAs($superadmin)
            ->get(route('admin.rekap-nilai.index', ['period_id' => $period->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/GradeReports/Index')
                ->has('scores', 1)
                ->where('scores.0.id', $score->id)
                ->where('scores.0.name', 'Mahasiswa Uji')
                ->where('scores.0.nim', '240999')
            );

        $this->from(route('admin.rekap-nilai.index', ['period_id' => $period->id]))
            ->actingAs($superadmin)
            ->patch(route('admin.grade-reports.finalisasi', $score))
            ->assertRedirect(route('admin.rekap-nilai.index', ['period_id' => $period->id]));

        $this->assertDatabaseHas('nilai_kkn', [
            'id' => $score->id,
            'is_finalized' => true,
        ]);
    }

    private function createStudentWithDivergedIds(
        ?Fakultas $faculty = null,
        ?Prodi $program = null,
        string $name = 'Mahasiswa Divergen',
        string $nim = '240001',
    ): array {
        $faculty ??= Fakultas::factory()->create();
        $program ??= Prodi::factory()->create([
            'faculty_id' => $faculty->id,
        ]);

        $studentUser = User::factory()->create([
            'name' => $name,
            'email' => strtolower(str_replace(' ', '.', $name)) . '@example.test',
        ]);
        $studentUser->assignRole('student');

        Mahasiswa::factory()->count(2)->create();

        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $studentUser->id,
            'nama' => $name,
            'nim' => $nim,
            'faculty_id' => $faculty->id,
            'program_id' => $program->id,
        ]);

        return [$studentUser, $mahasiswa];
    }
}
