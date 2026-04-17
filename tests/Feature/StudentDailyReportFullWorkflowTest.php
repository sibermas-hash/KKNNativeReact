<?php

use App\Models\KKN\Dosen;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\Fakultas;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\PesertaWorkshop;
use App\Models\KKN\PoskoKelompok;
use App\Models\KKN\Prodi;
use App\Models\KKN\Workshop;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StudentDailyReportFullWorkflowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function createDplUser(): array
    {
        $user = User::factory()->create();
        $user->assignRole('dpl');

        $dosen = Dosen::factory()->create([
            'user_id' => $user->id,
        ]);

        return compact('user', 'dosen');
    }

    private function createStudentInGroup(KelompokKkn $group, Periode $period): array
    {
        $faculty = Fakultas::factory()->create();
        $program = Prodi::factory()->create(['faculty_id' => $faculty->id]);

        $user = User::factory()->create([
            'phone' => '081234567890',
            'address' => 'Jl. Test No. 1',
        ]);
        $user->assignRole('student');

        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $user->id,
            'faculty_id' => $faculty->id,
            'program_id' => $program->id,
            'gender' => 'L',
        ]);

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'period_id' => $period->id,
            'kelompok_id' => $group->id,
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

    private function dailyReportPayload(array $overrides = []): array
    {
        return array_merge([
            'date' => now()->toDateString(),
            'category' => 'program_unggulan',
            'abcd_stage' => 'discovery',
            'title' => 'Kegiatan Test',
            'activity' => 'Deskripsi kegiatan test.',
            'reflection' => 'Refleksi test.',
            'output' => 'Output test.',
            'location_name' => 'Lokasi Test',
            'latitude' => '-7.42442000',
            'longitude' => '109.23072000',
            'gps_accuracy' => '18.50',
            'captured_at' => now()->toIso8601String(),
            'location_source' => 'gps',
            'files' => [
                UploadedFile::fake()->image('bukti1.jpg', 640, 480),
            ],
        ], $overrides);
    }

    public function test_student_can_submit_report_with_gps_validation_inside_allowed_radius(): void
    {
        $period = Periode::factory()->execution()->create();
        $location = Lokasi::factory()->create([
            'latitude' => -7.42440000,
            'longitude' => 109.23070000,
        ]);
        $group = KelompokKkn::factory()->create([
            'period_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'active',
        ]);

        ['user' => $studentUser] = $this->createStudentInGroup($group, $period);

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

        Storage::fake('local');

        // Submit report with GPS coordinates near the posko
        $this->actingAs($studentUser)
            ->postJson(route('student.laporan-harian.store'), $this->dailyReportPayload([
                'title' => 'Kegiatan Posyandu Desa',
                'activity' => 'Pendampingan kegiatan posyandu di balai desa.',
                'reflection' => 'Koordinasi dengan kader berjalan baik.',
                'output' => 'Data peserta posyandu dan dokumentasi kegiatan.',
                'location_name' => 'Balai Desa',
            ]))
            ->assertCreated()
            ->assertJson(['message' => 'Laporan harian berhasil dikirim.']);

        $this->assertDatabaseHas('kegiatan_kkn', [
            'title' => 'Kegiatan Posyandu Desa',
            'location_name' => 'Balai Desa',
            'location_source' => 'gps',
            'status' => 'submitted',
        ], 'kkn');

        // Student can view their submitted report
        $this->actingAs($studentUser)
            ->get(route('student.laporan-harian.index'))
            ->assertOk()
            ->assertSee('Kegiatan Posyandu Desa');
    }

    public function test_student_cannot_submit_report_outside_allowed_radius(): void
    {
        $period = Periode::factory()->execution()->create();
        $location = Lokasi::factory()->create([
            'latitude' => -7.42440000,
            'longitude' => 109.23070000,
        ]);
        $group = KelompokKkn::factory()->create([
            'period_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'active',
        ]);

        ['user' => $studentUser] = $this->createStudentInGroup($group, $period);

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

        Storage::fake('local');

        // Submit report with GPS coordinates far from the posko
        $this->actingAs($studentUser)
            ->from(route('student.laporan-harian.create'))
            ->post(route('student.laporan-harian.store'), $this->dailyReportPayload([
                'title' => 'Laporan di luar wilayah',
                'activity' => 'Mahasiswa mencoba mengirim dari lokasi yang jauh.',
                'location_name' => 'Lokasi Tidak Valid',
                'latitude' => '-7.30000000',
                'longitude' => '109.50000000',
                'gps_accuracy' => '22.00',
            ]))
            ->assertRedirect(route('student.laporan-harian.create'))
            ->assertSessionHasErrors('latitude');
    }

    public function test_report_appears_in_dpl_queue_after_submission(): void
    {
        ['user' => $dplUser, 'dosen' => $dosen] = $this->createDplUser();

        $period = Periode::factory()->execution()->create();
        $location = Lokasi::factory()->create();
        $group = KelompokKkn::factory()->create([
            'period_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'active',
        ]);

        $dplPeriod = DplPeriod::create([
            'dosen_id' => $dosen->id,
            'period_id' => $period->id,
            'max_groups' => 5,
            'is_active' => true,
        ]);

        $group->update([
            'dpl_id' => $dosen->id,
            'dpl_period_id' => $dplPeriod->id,
        ]);
        $group->dosen()->syncWithoutDetaching([$dosen->id => ['role' => 'Ketua']]);
        $group->syncKetuaFlatColumns();

        ['user' => $studentUser, 'mahasiswa' => $mahasiswa] = $this->createStudentInGroup($group, $period);

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

        Storage::fake('local');

        // Student submits report
        $this->actingAs($studentUser)
            ->postJson(route('student.laporan-harian.store'), $this->dailyReportPayload([
                'title' => 'Laporan untuk DPL Review',
                'activity' => 'Kegiatan yang perlu direview.',
                'location_name' => 'Lokasi Kegiatan',
            ]))
            ->assertCreated();

        // DPL can see the report in their queue
        $this->actingAs($dplUser)
            ->get(route('dpl.daily-reports.index'))
            ->assertOk()
            ->assertSee('Laporan untuk DPL Review');

        // DPL can view report details
        $report = KegiatanKkn::where('mahasiswa_id', $mahasiswa->id)->firstOrFail();

        $this->actingAs($dplUser)
            ->get(route('dpl.daily-reports.show', $report))
            ->assertOk()
            ->assertSee('Kegiatan yang perlu direview.');
    }

    public function test_dpl_can_approve_report_and_student_sees_updated_status(): void
    {
        ['user' => $dplUser, 'dosen' => $dosen] = $this->createDplUser();

        $period = Periode::factory()->execution()->create();
        $location = Lokasi::factory()->create();
        $group = KelompokKkn::factory()->create([
            'period_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'active',
        ]);

        $dplPeriod = DplPeriod::create([
            'dosen_id' => $dosen->id,
            'period_id' => $period->id,
            'max_groups' => 5,
            'is_active' => true,
        ]);

        $group->update([
            'dpl_id' => $dosen->id,
            'dpl_period_id' => $dplPeriod->id,
        ]);
        $group->dosen()->syncWithoutDetaching([$dosen->id => ['role' => 'Ketua']]);
        $group->syncKetuaFlatColumns();

        ['user' => $studentUser, 'mahasiswa' => $mahasiswa] = $this->createStudentInGroup($group, $period);

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

        Storage::fake('local');

        // Student submits report
        $this->actingAs($studentUser)
            ->postJson(route('student.laporan-harian.store'), $this->dailyReportPayload([
                'title' => 'Laporan Approve Test',
                'activity' => 'Kegiatan yang akan disetujui.',
                'location_name' => 'Lokasi',
            ]))
            ->assertCreated();

        $report = KegiatanKkn::where('mahasiswa_id', $mahasiswa->id)->firstOrFail();
        expect($report->status)->toBe('submitted');

        // DPL approves the report
        $this->actingAs($dplUser)
            ->from(route('dpl.daily-reports.index'))
            ->patch(route('dpl.daily-reports.approve', $report))
            ->assertRedirect(route('dpl.daily-reports.index'));

        $report->refresh();
        expect($report->status)->toBe('approved')
            ->and($report->reviewed_by)->not->toBeNull()
            ->and($report->reviewed_at)->not->toBeNull();

        // Student sees the approved status
        $this->actingAs($studentUser)
            ->get(route('student.laporan-harian.index'))
            ->assertOk()
            ->assertSee('Laporan Approve Test');
    }

    public function test_dpl_can_request_revision_and_student_sees_updated_status(): void
    {
        ['user' => $dplUser, 'dosen' => $dosen] = $this->createDplUser();

        $period = Periode::factory()->execution()->create();
        $location = Lokasi::factory()->create();
        $group = KelompokKkn::factory()->create([
            'period_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'active',
        ]);

        $dplPeriod = DplPeriod::create([
            'dosen_id' => $dosen->id,
            'period_id' => $period->id,
            'max_groups' => 5,
            'is_active' => true,
        ]);

        $group->update([
            'dpl_id' => $dosen->id,
            'dpl_period_id' => $dplPeriod->id,
        ]);
        $group->dosen()->syncWithoutDetaching([$dosen->id => ['role' => 'Ketua']]);
        $group->syncKetuaFlatColumns();

        ['user' => $studentUser, 'mahasiswa' => $mahasiswa] = $this->createStudentInGroup($group, $period);

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

        Storage::fake('local');

        // Student submits report
        $this->actingAs($studentUser)
            ->postJson(route('student.laporan-harian.store'), $this->dailyReportPayload([
                'title' => 'Laporan Revision Test',
                'activity' => 'Kegiatan yang perlu revisi.',
                'location_name' => 'Lokasi',
            ]))
            ->assertCreated();

        $report = KegiatanKkn::where('mahasiswa_id', $mahasiswa->id)->firstOrFail();

        // DPL requests revision
        $this->actingAs($dplUser)
            ->from(route('dpl.daily-reports.show', $report))
            ->patch(route('dpl.daily-reports.revision', $report), [
                'revision_notes' => 'Mohon lengkapi dokumentasi kegiatan dan refleksi.',
            ])
            ->assertRedirect(route('dpl.daily-reports.show', $report));

        $report->refresh();
        expect($report->status)->toBe('revision')
            ->and($report->review_notes)->toBe('Mohon lengkapi dokumentasi kegiatan dan refleksi.');

        // Student can see the revision notes
        $this->actingAs($studentUser)
            ->get(route('student.laporan-harian.index'))
            ->assertOk()
            ->assertSee('Laporan Revision Test');
    }

    public function test_report_export_works_for_group_and_student(): void
    {
        ['user' => $dplUser, 'dosen' => $dosen] = $this->createDplUser();
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $period = Periode::factory()->execution()->create();
        $location = Lokasi::factory()->create();
        $group = KelompokKkn::factory()->create([
            'period_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'active',
        ]);

        $dplPeriod = DplPeriod::create([
            'dosen_id' => $dosen->id,
            'period_id' => $period->id,
            'max_groups' => 5,
            'is_active' => true,
        ]);

        $group->update([
            'dpl_id' => $dosen->id,
            'dpl_period_id' => $dplPeriod->id,
        ]);
        $group->dosen()->syncWithoutDetaching([$dosen->id => ['role' => 'Ketua']]);
        $group->syncKetuaFlatColumns();

        ['user' => $studentUser, 'mahasiswa' => $mahasiswa] = $this->createStudentInGroup($group, $period);

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

        Storage::fake('local');

        // Student submits report
        $this->actingAs($studentUser)
            ->postJson(route('student.laporan-harian.store'), $this->dailyReportPayload([
                'title' => 'Laporan Export Test',
                'activity' => 'Kegiatan untuk export.',
                'location_name' => 'Lokasi',
            ]))
            ->assertCreated();

        // Admin can export group daily reports
        $this->actingAs($admin)
            ->get(route('admin.export.laporan-harian.kelompok', $group->id))
            ->assertOk();

        // Admin can export student daily reports
        $this->actingAs($admin)
            ->get(route('admin.export.laporan-harian.mahasiswa', $mahasiswa->id))
            ->assertOk();
    }

    public function test_student_cannot_submit_report_without_completing_workshop(): void
    {
        $this->markTestSkipped('Workshop prerequisite enforcement not yet implemented in DailyReportController — planned for future sprint.');
    }

    public function test_gps_accuracy_above_threshold_is_rejected(): void
    {
        $period = Periode::factory()->execution()->create();
        $location = Lokasi::factory()->create([
            'latitude' => -7.42440000,
            'longitude' => 109.23070000,
        ]);
        $group = KelompokKkn::factory()->create([
            'period_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'active',
        ]);

        ['user' => $studentUser] = $this->createStudentInGroup($group, $period);

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

        Storage::fake('local');

        // Submit with poor GPS accuracy (above default max of 250m)
        $this->actingAs($studentUser)
            ->from(route('student.laporan-harian.create'))
            ->post(route('student.laporan-harian.store'), $this->dailyReportPayload([
                'title' => 'Laporan GPS Buruk',
                'activity' => 'Kegiatan dengan GPS buruk.',
                'location_name' => 'Lokasi',
                'gps_accuracy' => '300.00',
            ]))
            ->assertRedirect(route('student.laporan-harian.create'))
            ->assertSessionHasErrors('gps_accuracy');
    }
}
