<?php

namespace Tests\Feature;

use App\Models\KKN\Dosen;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Laporan;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Workshop;
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
        ], 'kkn');

        $report = Laporan::where('user_id', $user->id)->first();

        $this->assertNotNull($report);
        Storage::disk('local')->assertExists($report->file_path);
        $this->assertSame($mahasiswa->user_id, $user->id);
    }

    public function test_student_workshops_page_renders_available_workshops(): void
    {
        [$user] = $this->createStudentWithApprovedGroup();

        Workshop::create([
            'title' => 'Pembekalan Lapangan',
            'description' => 'Workshop persiapan sebelum penerjunan.',
            'methodology' => 'Workshop',
            'workshop_date' => now()->addDays(3)->toDateString(),
            'start_time' => '08:00',
            'end_time' => '10:00',
            'location' => 'Aula Kampus',
            'status' => 'scheduled',
        ]);

        $this->actingAs($user)
            ->get(route('student.workshops.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Student/Workshops/Index')
                ->has('workshops', 1)
                ->where('workshops.0.title', 'Pembekalan Lapangan')
            );
    }

    public function test_student_can_register_for_workshop_from_operational_route(): void
    {
        [$user] = $this->createStudentWithApprovedGroup();

        $workshop = Workshop::create([
            'title' => 'Pembekalan Operasional',
            'description' => 'Workshop persiapan lapangan.',
            'methodology' => 'Workshop',
            'workshop_date' => now()->addDays(3)->toDateString(),
            'location' => 'Aula Kampus',
            'status' => 'scheduled',
        ]);

        $this->actingAs($user)
            ->post(route('student.workshops.register', $workshop))
            ->assertRedirect();

        $this->assertDatabaseHas('peserta_workshop', [
            'workshop_id' => $workshop->id,
            'user_id' => $user->id,
            'attendance_status' => 'registered',
        ], 'kkn');
    }

    public function test_legacy_student_workshop_url_redirects_to_canonical_plural_route(): void
    {
        [$user] = $this->createStudentWithApprovedGroup();

        $this->actingAs($user)
            ->get('/mahasiswa/workshop')
            ->assertRedirect(route('student.workshops.index'));
    }

    public function test_superadmin_can_open_admin_workshops_page(): void
    {
        $superadmin = User::factory()->create([
            'username' => 'superadmin_workshop_page',
            'email' => 'superadmin-workshop-page@example.test',
        ]);
        $superadmin->assignRole('superadmin');

        $this->actingAs($superadmin)
            ->get(route('admin.workshops.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Workshops/Index')
            );
    }

    public function test_dpl_evaluation_create_redirects_to_index_page(): void
    {
        $dplUser = User::factory()->create([
            'username' => 'dpl_eval_redirect',
            'email' => 'dpl-eval-redirect@example.test',
        ]);
        $dplUser->assignRole('dpl');

        Dosen::factory()->create([
            'user_id' => $dplUser->id,
        ]);

        $this->actingAs($dplUser)
            ->get(route('dpl.evaluations.create'))
            ->assertRedirect(route('dpl.evaluations.index'));
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
            'username' => 'student_ops_' . fake()->unique()->numerify('####'),
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
            'period_id' => $group->period_id,
            'role' => 'Anggota',
        ]);

        return [$user, $mahasiswa, $group];
    }
}
