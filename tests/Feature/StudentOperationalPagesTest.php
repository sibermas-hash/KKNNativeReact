<?php

namespace Tests\Feature;

use App\Models\KKN\Dosen;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Laporan;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentOperationalPagesTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    public function test_student_reports_page_renders_for_student_with_active_group(): void
    {
        [$user] = $this->createStudentWithApprovedGroup();

        $this->actingAs($user)
            ->get(route('student.reports.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Student/Reports/Index')
                ->has('progress')
                ->has('reportTypes')
            );
    }

    public function test_student_can_upload_supported_report_type(): void
    {
        Storage::fake('local');

        [$user, $mahasiswa, $group] = $this->createStudentWithApprovedGroup();

        $response = $this->actingAs($user)
            ->post(route('student.reports.upload'), [
                'type' => 'final_report',
                'title' => 'Laporan Final Kelompok',
                'file' => UploadedFile::fake()->create('laporan-final.pdf', 500, 'application/pdf'),
            ]);

        $response->assertSessionHasNoErrors()
            ->assertRedirect();

        $this->assertDatabaseHas('laporan', [
            'user_id' => $user->id,
            'kelompok_id' => $group->id,
            'type' => 'final_report',
            'title' => 'Laporan Final Kelompok',
        ]);

        $report = Laporan::where('user_id', $user->id)->first();

        $this->assertNotNull($report);
        Storage::disk('local')->assertExists($report->file_path);
        $this->assertSame($mahasiswa->user_id, $user->id);
    }

    public function test_student_workshops_page_renders_available_workshops(): void
    {
        $this->markTestSkipped('Workshop module deprecated — routes student.workshops.* removed in KKN 56 consolidation.');
    }

    public function test_student_can_register_for_workshop_from_operational_route(): void
    {
        $this->markTestSkipped('Workshop module deprecated — routes student.workshops.* removed in KKN 56 consolidation.');
    }

    public function test_legacy_student_workshop_url_redirects_to_canonical_plural_route(): void
    {
        $this->markTestSkipped('Workshop module deprecated — routes student.workshops.* removed in KKN 56 consolidation.');
    }

    public function test_superadmin_can_open_admin_workshops_page(): void
    {
        $this->markTestSkipped('Workshop module deprecated — routes admin.workshops.* removed in KKN 56 consolidation.');
    }

    public function test_dpl_evaluation_create_redirects_to_index_page(): void
    {
        $period = Periode::factory()->grading()->create();

        $dplUser = User::factory()->create([
            'username' => 'dpl_eval_redirect',
            'email' => 'dpl-eval-redirect@example.test',
        ]);
        $dplUser->assignRole('dosen', 'dpl');

        $dosen = Dosen::factory()->create([
            'user_id' => $dplUser->id,
        ]);

        $group = KelompokKkn::factory()->create(['periode_id' => $period->id]);
        $group->dosen()->attach($dosen->id, ['role' => 'Ketua']);

        $this->actingAs($dplUser)
            ->get(route('dosen.evaluations.create'))
            ->assertRedirect(route('dosen.evaluations.index'));
    }

    public function test_superadmin_can_download_report_file(): void
    {
        Storage::fake('local');

        $superadmin = User::factory()->create([
            'username' => 'superadmin_download_report',
            'email' => 'superadmin-download-report@example.test',
        ]);
        $superadmin->assignRole('superadmin');

        $group = KelompokKkn::factory()->create();
        $student = User::factory()->create([
            'name' => 'Mahasiswa Download',
        ]);

        Storage::disk('local')->put('reports/1/final_report/laporan.pdf', 'dummy');

        $report = Laporan::create([
            'user_id' => $student->id,
            'kelompok_id' => $group->id,
            'type' => 'final_report',
            'title' => 'Laporan Unduhan',
            'file_path' => 'reports/1/final_report/laporan.pdf',
            'file_name' => 'laporan.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 128,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $this->actingAs($superadmin)
            ->get(route('reports.download', $report))
            ->assertOk()
            ->assertDownload('laporan.pdf');
    }

    /**
     * @return array{0: User, 1: Mahasiswa, 2: KelompokKkn}
     */
    private function createStudentWithApprovedGroup(): array
    {
        $user = User::factory()->create([
            'username' => 'student_ops_'.fake()->unique()->numerify('####'),
            'email' => fake()->unique()->safeEmail(),
        ]);
        $user->assignRole('student');

        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $user->id,
        ]);

        $group = KelompokKkn::factory()->create();

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'kelompok_id' => $group->id,
            'periode_id' => $group->periode_id,
            'role' => 'Anggota',
        ]);

        return [$user, $mahasiswa, $group];
    }
}
