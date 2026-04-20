<?php

use App\Ai\Agents\ActivityReviewerAgent;
use App\Models\KKN\Dosen;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\Fakultas;
use App\Models\KKN\JenisKkn;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\PesertaWorkshop;
use App\Models\KKN\PoskoKelompok;
use App\Models\KKN\Prodi;
use App\Models\KKN\TahunAkademik;
use App\Models\KKN\Workshop;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Ai\Responses\StructuredAgentResponse;
use Tests\TestCase;

class MultiRoleWorkflowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        Storage::fake(config('filesystems.default'));

        // Mock AI Agent to avoid external API calls during tests
        $this->mock(ActivityReviewerAgent::class, function ($mock) {
            $structuredResponse = Mockery::mock(StructuredAgentResponse::class);
            $structuredResponse->shouldReceive('toArray')->andReturn([
                'summary' => 'Ringkasan kegiatan simulasi.',
                'abcd_compliance' => 10,
                'quality_score' => 10,
                'feedback' => 'Bagus, lanjutkan.',
                'flagged' => false,
                'tags' => ['Simulasi'],
            ]);

            $mock->shouldReceive('prompt')->andReturn($structuredResponse);
        });
    }

    private function createSuperadmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole('superadmin');

        return $user;
    }

    private function createFacultyAdmin(Fakultas $faculty): User
    {
        $user = User::factory()->create([
            'fakultas_id' => $faculty->id,
        ]);
        $user->assignRole('faculty_admin');

        return $user;
    }

    private function createDplUser(): array
    {
        $user = User::factory()->create();
        $user->assignRole('dosen', 'dpl');

        $dosen = Dosen::factory()->create([
            'user_id' => $user->id,
        ]);

        return compact('user', 'dosen');
    }

    private function createStudentUser(Fakultas $faculty, Prodi $program): array
    {
        $user = User::factory()->create([
            'phone' => '081234567890',
            'address' => 'Jl. Test No. 1',
        ]);
        $user->assignRole('student');

        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $user->id,
            'fakultas_id' => $faculty->id,
            'prodi_id' => $program->id,
            'gender' => 'L',
            'shirt_size' => 'L',
        ]);

        return compact('user', 'mahasiswa');
    }

    private function completeWorkshop(User $user): void
    {
        $workshop = Workshop::create([
            'title' => 'Pembekalan Wajib',
            'description' => 'Pembekalan dasar.',
            'methodology' => 'Workshop',
            'workshop_date' => now()->subDay()->toDateString(),
            'start_time' => '08:00',
            'end_time' => '10:00',
            'location' => 'Aula Kampus',
            'status' => 'completed',
        ]);

        PesertaWorkshop::create([
            'workshop_id' => $workshop->id,
            'user_id' => $user->id,
            'registered_at' => now()->subDay(),
            'attendance_status' => 'attended',
            'checked_in_at' => now()->subDay(),
        ]);
    }

    public function test_superadmin_creates_period_and_groups(): void
    {
        $superadmin = $this->createSuperadmin();

        $academicYear = TahunAkademik::factory()->create(['year' => '2026/2027']);

        // Superadmin creates period
        $this->actingAs($superadmin)
            ->post(route('admin.periode.store'), [
                'academic_year_id' => $academicYear->id,
                'jenis_kkn_id' => JenisKkn::where('code', 'REGULER')->firstOrFail()->id,
                'periode' => 57,
                'program_type' => Periode::PROGRAM_TYPE_REGULER,
                'program_subtype' => null,
                'jenis' => 'KKN Reguler',
                'name' => 'KKN Reguler 2026',
                'start_date' => now()->addWeeks(3)->toDateString(),
                'end_date' => now()->addWeeks(11)->toDateString(),
                'registration_start' => now()->subWeek()->toDateString(),
                'registration_end' => now()->addWeek(2)->toDateString(),
                'kuota' => 2000,
                'is_active' => true,
            ])
            ->assertRedirect(route('admin.periode.index'));

        $period = Periode::where('name', 'KKN Reguler 2026')->firstOrFail();
        expect($period->is_active)->toBeTrue();

        // Superadmin creates groups
        $location = Lokasi::factory()->create();
        $group = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'location_id' => $location->id,
            'nama_kelompok' => 'Kelompok Mawar',
            'status' => 'active',
            'capacity' => 10,
        ]);

        $this->assertDatabaseHas('kelompok_kkn', [
            'periode_id' => $period->id,
            'nama_kelompok' => 'Kelompok Mawar',
        ]);

        // Superadmin can view group management page
        $this->actingAs($superadmin)
            ->get(route('admin.kelompok.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Operational/Groups/Index')
            );
    }

    public function test_faculty_admin_views_faculty_scoped_data(): void
    {
        $facultyA = Fakultas::factory()->create(['nama' => 'Fakultas Tarbiyah']);
        $facultyB = Fakultas::factory()->create(['nama' => 'Fakultas Syariah']);

        $programA = Prodi::factory()->create(['fakultas_id' => $facultyA->id]);
        $programB = Prodi::factory()->create(['fakultas_id' => $facultyB->id]);

        $facultyAdmin = $this->createFacultyAdmin($facultyA);

        $period = Periode::factory()->active()->create();

        // Create students from different faculties
        ['mahasiswa' => $studentA] = $this->createStudentUser($facultyA, $programA);
        ['mahasiswa' => $studentB] = $this->createStudentUser($facultyB, $programB);

        $location = Lokasi::factory()->create();
        $group = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'active',
        ]);

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $studentA->id,
            'periode_id' => $period->id,
            'kelompok_id' => $group->id,
        ]);

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $studentB->id,
            'periode_id' => $period->id,
            'kelompok_id' => $group->id,
        ]);

        // Faculty admin should see faculty-scoped data
        $this->actingAs($facultyAdmin)
            ->get(route('admin.pendaftaran.index'))
            ->assertOk();
    }

    public function test_dpl_reviews_reports_for_assigned_group(): void
    {
        ['user' => $dplUser, 'dosen' => $dosen] = $this->createDplUser();

        $period = Periode::factory()->active()->create([
            'current_phase' => 'execution',
        ]);
        $location = Lokasi::factory()->create();
        $group = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'active',
        ]);

        // Assign DPL to group
        $dplPeriod = DplPeriod::create([
            'dosen_id' => $dosen->id,
            'periode_id' => $period->id,
            'max_groups' => 5,
            'is_active' => true,
        ]);

        $group->update([
            'dpl_id' => $dosen->id,
            'dpl_periode_id' => $dplPeriod->id,
        ]);
        $group->dosen()->syncWithoutDetaching([$dosen->id => ['role' => 'Ketua']]);
        $group->syncKetuaFlatColumns();

        // Create a student in this group
        $faculty = Fakultas::factory()->create();
        $program = Prodi::factory()->create(['fakultas_id' => $faculty->id]);
        ['user' => $studentUser, 'mahasiswa' => $mahasiswa] = $this->createStudentUser($faculty, $program);

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'periode_id' => $period->id,
            'kelompok_id' => $group->id,
        ]);

        PoskoKelompok::create([
            'kelompok_id' => $group->id,
            'latitude' => -7.42440000,
            'longitude' => 109.23070000,
            'photo_path' => 'posko-photos/test.jpg',
            'photo_name' => 'test.jpg',
            'photo_size' => 1024,
            'uploaded_by' => $studentUser->id,
        ]);

        $this->completeWorkshop($studentUser);

        // Student submits daily report
        $this->actingAs($studentUser)
            ->postJson(route('student.laporan-harian.store'), [
                'date' => now()->toDateString(),
                'title' => 'Kegiatan Lapangan',
                'activity' => 'Survey lokasi program kerja.',
                'location_name' => 'Desa Binaan',
                'latitude' => '-7.42442000',
                'longitude' => '109.23072000',
                'gps_accuracy' => '18.50',
                'captured_at' => now()->toIso8601String(),
                'location_source' => 'gps',
                'category' => 'program_unggulan',
                'abcd_stage' => 'discovery',
                'files' => [UploadedFile::fake()->image('test.jpg')],
            ])
            ->assertCreated();

        $report = KegiatanKkn::where('mahasiswa_id', $mahasiswa->id)->firstOrFail();

        // DPL can see and review the report
        $this->actingAs($dplUser)
            ->get(route('dosen.daily-reports.index'))
            ->assertOk()
            ->assertSee('Kegiatan Lapangan');

        $this->actingAs($dplUser)
            ->patch(route('dosen.daily-reports.approve', $report))
            ->assertRedirect();

        $report->refresh();
        expect($report->status)->toBe('approved');
    }

    public function test_student_sees_only_own_data(): void
    {
        $faculty = Fakultas::factory()->create();
        $program = Prodi::factory()->create(['fakultas_id' => $faculty->id]);

        ['user' => $studentUser1, 'mahasiswa' => $mahasiswa1] = $this->createStudentUser($faculty, $program);
        ['user' => $studentUser2, 'mahasiswa' => $mahasiswa2] = $this->createStudentUser($faculty, $program);

        $period = Periode::factory()->active()->create([
            'current_phase' => 'execution',
        ]);
        $location = Lokasi::factory()->create();
        $group = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'active',
        ]);

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $mahasiswa1->id,
            'periode_id' => $period->id,
            'kelompok_id' => $group->id,
        ]);

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $mahasiswa2->id,
            'periode_id' => $period->id,
            'kelompok_id' => $group->id,
        ]);

        $this->completeWorkshop($studentUser1);
        $this->completeWorkshop($studentUser2);

        PoskoKelompok::create([
            'kelompok_id' => $group->id,
            'latitude' => -7.42440000,
            'longitude' => 109.23070000,
            'photo_path' => 'posko-photos/test.jpg',
            'photo_name' => 'test.jpg',
            'photo_size' => 1024,
            'uploaded_by' => $studentUser1->id,
        ]);

        // Student 1 submits a report
        $this->actingAs($studentUser1)
            ->postJson(route('student.laporan-harian.store'), [
                'date' => now()->toDateString(),
                'title' => 'Laporan Student 1',
                'activity' => 'Kegiatan student 1.',
                'location_name' => 'Lokasi 1',
                'latitude' => '-7.42442000',
                'longitude' => '109.23072000',
                'gps_accuracy' => '18.50',
                'captured_at' => now()->toIso8601String(),
                'location_source' => 'gps',
                'category' => 'program_unggulan',
                'abcd_stage' => 'discovery',
                'files' => [UploadedFile::fake()->image('test.jpg')],
            ])
            ->assertCreated();

        // Student 2 submits a report
        $this->actingAs($studentUser2)
            ->postJson(route('student.laporan-harian.store'), [
                'date' => now()->toDateString(),
                'title' => 'Laporan Student 2',
                'activity' => 'Kegiatan student 2.',
                'location_name' => 'Lokasi 2',
                'latitude' => '-7.42442000',
                'longitude' => '109.23072000',
                'gps_accuracy' => '18.50',
                'captured_at' => now()->toIso8601String(),
                'location_source' => 'gps',
                'category' => 'program_unggulan',
                'abcd_stage' => 'discovery',
                'files' => [UploadedFile::fake()->image('test.jpg')],
            ])
            ->assertCreated();

        // Student 1 should only see their own report
        $this->actingAs($studentUser1)
            ->get(route('student.laporan-harian.index'))
            ->assertOk()
            ->assertSee('Laporan Student 1')
            ->assertDontSee('Laporan Student 2');
    }

    public function test_cross_role_authorization_is_enforced(): void
    {
        $superadmin = $this->createSuperadmin();

        $faculty = Fakultas::factory()->create();
        $program = Prodi::factory()->create(['fakultas_id' => $faculty->id]);
        ['user' => $studentUser, 'mahasiswa' => $mahasiswa] = $this->createStudentUser($faculty, $program);

        ['user' => $dplUser, 'dosen' => $dosen] = $this->createDplUser();

        $period = Periode::factory()->active()->create();
        $location = Lokasi::factory()->create();
        $group = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'active',
        ]);

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'periode_id' => $period->id,
            'kelompok_id' => $group->id,
        ]);

        // Student cannot access admin pages
        $this->actingAs($studentUser)
            ->get(route('admin.dashboard'))
            ->assertStatus(302);

        // Student cannot access DPL pages
        $this->actingAs($studentUser)
            ->get(route('dosen.dashboard'))
            ->assertStatus(302);

        // DPL cannot access superadmin-only pages
        $this->actingAs($dplUser)
            ->get(route('admin.pendaftaran.index'))
            ->assertStatus(302);

        // DPL cannot access student pages
        $this->actingAs($dplUser)
            ->get(route('student.dashboard'))
            ->assertForbidden();

        // Superadmin cannot access student pages directly as student
        $this->actingAs($superadmin)
            ->get(route('student.dashboard'))
            ->assertForbidden();

        // Superadmin can access admin pages
        $this->actingAs($superadmin)
            ->get(route('admin.dashboard'))
            ->assertOk();
    }

    public function test_dpl_cannot_access_reports_from_unassigned_group(): void
    {
        ['user' => $dplUser1, 'dosen' => $dosen1] = $this->createDplUser();
        ['user' => $dplUser2, 'dosen' => $dosen2] = $this->createDplUser();

        $period = Periode::factory()->active()->create([
            'current_phase' => 'execution',
        ]);
        $location = Lokasi::factory()->create();

        $group1 = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'active',
        ]);

        $group2 = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'active',
        ]);

        // Assign DPL 1 to group 1
        $dplPeriod1 = DplPeriod::create([
            'dosen_id' => $dosen1->id,
            'periode_id' => $period->id,
            'max_groups' => 5,
            'is_active' => true,
        ]);
        $group1->update(['dpl_id' => $dosen1->id, 'dpl_periode_id' => $dplPeriod1->id]);
        $group1->dosen()->syncWithoutDetaching([$dosen1->id => ['role' => 'Ketua']]);
        $group1->syncKetuaFlatColumns();

        // Assign DPL 2 to group 2
        $dplPeriod2 = DplPeriod::create([
            'dosen_id' => $dosen2->id,
            'periode_id' => $period->id,
            'max_groups' => 5,
            'is_active' => true,
        ]);
        $group2->update(['dpl_id' => $dosen2->id, 'dpl_periode_id' => $dplPeriod2->id]);
        $group2->dosen()->syncWithoutDetaching([$dosen2->id => ['role' => 'Ketua']]);
        $group2->syncKetuaFlatColumns();

        $faculty = Fakultas::factory()->create();
        $program = Prodi::factory()->create(['fakultas_id' => $faculty->id]);
        ['user' => $studentUser, 'mahasiswa' => $mahasiswa] = $this->createStudentUser($faculty, $program);

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'periode_id' => $period->id,
            'kelompok_id' => $group1->id,
        ]);

        PoskoKelompok::create([
            'kelompok_id' => $group1->id,
            'latitude' => -7.42440000,
            'longitude' => 109.23070000,
            'photo_path' => 'posko-photos/test.jpg',
            'photo_name' => 'test.jpg',
            'photo_size' => 1024,
            'uploaded_by' => $studentUser->id,
        ]);

        $this->completeWorkshop($studentUser);

        // Student submits report in group 1
        $this->actingAs($studentUser)
            ->postJson(route('student.laporan-harian.store'), [
                'date' => now()->toDateString(),
                'title' => 'Laporan Group 1',
                'activity' => 'Kegiatan di group 1.',
                'location_name' => 'Group 1 Location',
                'latitude' => '-7.42442000',
                'longitude' => '109.23072000',
                'gps_accuracy' => '18.50',
                'captured_at' => now()->toIso8601String(),
                'location_source' => 'gps',
                'category' => 'program_unggulan',
                'abcd_stage' => 'discovery',
                'files' => [UploadedFile::fake()->image('test.jpg')],
            ])
            ->assertCreated();

        $report = KegiatanKkn::firstOrFail();

        // DPL 2 (from group 2) cannot access report from group 1
        $this->actingAs($dplUser2)
            ->get(route('dosen.daily-reports.show', $report))
            ->assertForbidden();
    }
}
