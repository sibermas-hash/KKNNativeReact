<?php

use App\Models\KKN\Dosen;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\Fakultas;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\KonfigurasiPenilaian;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\PesertaWorkshop;
use App\Models\KKN\PoskoKelompok;
use App\Models\KKN\Prodi;
use App\Models\KKN\ProgramKerja;
use App\Models\KKN\SystemSetting;
use App\Models\KKN\Workshop;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class FullRegistrationToGradingWorkflowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function createAdminUser(): User
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');
        return $admin;
    }

    private function createDplUser(array $overrides = []): array
    {
        Role::firstOrCreate(['name' => 'dpl', 'guard_name' => 'web']);

        $user = User::factory()->create($overrides);
        $user->assignRole('dpl');

        $dosen = Dosen::factory()->create([
            'user_id' => $user->id,
        ]);

        return compact('user', 'dosen');
    }

    private function createStudentUser(array $overrides = []): array
    {
        $faculty = Fakultas::factory()->create();
        $program = Prodi::factory()->create(['faculty_id' => $faculty->id]);

        $user = User::factory()->create(array_merge([
            'phone' => '081234567890',
            'address' => 'Jl. Raya Karangsari No. 10',
            'domicile_village_name' => 'Desa Asal Mahasiswa',
            'domicile_district_name' => 'Kecamatan Asal Mahasiswa',
            'domicile_regency_name' => 'Kabupaten Asal Mahasiswa',
            'address_verified_at' => now(),
        ], $overrides));
        $user->assignRole('student');

        $mahasiswa = Mahasiswa::factory()->create([
            'user_id' => $user->id,
            'nama' => 'Ahmad Fauzi',
            'nim' => '2024001234',
            'batch_year' => 2024,
            'nik' => '3301010101010001',
            'mother_name' => 'Siti Fauziah',
            'birth_place' => 'Banyumas',
            'birth_date' => '2003-01-01',
            'faculty_id' => $faculty->id,
            'program_id' => $program->id,
            'gender' => 'L',
        ]);

        return compact('user', 'mahasiswa', 'faculty', 'program');
    }

    private function ensureWorkshopCompleted(User $user): void
    {
        $workshop = Workshop::create([
            'title' => 'Pembekalan Wajib',
            'description' => 'Pembekalan dasar sebelum laporan harian.',
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

    public function test_full_registration_to_grading_workflow(): void
    {
        // ── Step 1: Admin creates period ──────────────────────────────
        $admin = $this->createAdminUser();

        $this->actingAs($admin)
            ->post(route('admin.periode.store'), [
                'academic_year_id' => \App\Models\KKN\TahunAkademik::factory()->create(['year' => '2026/2027'])->id,
                'periode' => 57,
                'program_type' => Periode::PROGRAM_TYPE_REGULER,
                'program_subtype' => null,
                'jenis' => 'KKN Reguler',
                'name' => 'KKN Reguler 2026',
                'start_date' => now()->addWeeks(2)->toDateString(),
                'end_date' => now()->addWeeks(10)->toDateString(),
                'registration_start' => now()->subWeek()->toDateString(),
                'registration_end' => now()->addWeek(2)->toDateString(),
                'grading_start' => now()->subWeek()->toDateString(),
                'grading_end' => now()->addWeek()->toDateString(),
                'kuota' => 2000,
                'is_active' => true,
            ])
            ->assertRedirect(route('admin.periode.index'));

        $period = Periode::where('name', 'KKN Reguler 2026')->firstOrFail();
        expect($period->is_active)->toBeTrue();

        // ── Step 2: Student registers for KKN ─────────────────────────
        ['user' => $studentUser, 'mahasiswa' => $mahasiswa] = $this->createStudentUser();

        $location = Lokasi::factory()->create([
            'village_name' => 'Desa Karangsari',
            'district_name' => 'Kecamatan Kembaran',
            'regency_name' => 'Kabupaten Banyumas',
        ]);

        $group = KelompokKkn::factory()->create([
            'period_id' => $period->id,
            'location_id' => $location->id,
            'nama_kelompok' => 'Kelompok Melati',
            'status' => 'active',
            'capacity' => 12,
        ]);

        $this->actingAs($studentUser)
            ->post(route('student.registration.store'), [
                'period_id' => $period->id,
                'notes' => 'Siap mengikuti KKN.',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('peserta_kkn', [
            'mahasiswa_id' => $mahasiswa->id,
            'period_id' => $period->id,
            'kelompok_id' => null,
            'status' => 'pending',
        ], 'kkn');

        // ── Step 3: Admin approves registration ───────────────────────
        $registration = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->where('period_id', $period->id)
            ->firstOrFail();

        $this->actingAs($admin)
            ->patch(route('admin.pendaftaran.setujui', $registration))
            ->assertRedirect();

        $this->assertDatabaseHas('peserta_kkn', [
            'id' => $registration->id,
            'status' => 'approved',
            'kelompok_id' => $group->id,
            'approved_by' => $admin->id,
        ], 'kkn');

        $registration->refresh();
        expect($registration->kelompok_id)->toBe($group->id);

        // ── Step 4: DPL is assigned to group ──────────────────────────
        ['user' => $dplUser, 'dosen' => $dosen] = $this->createDplUser();

        $dplPeriod = DplPeriod::create([
            'dosen_id' => $dosen->id,
            'period_id' => $period->id,
            'max_groups' => 5,
            'is_active' => true,
        ]);

        $this->actingAs($admin)
            ->from(route('admin.dpl.penugasan'))
            ->post(route('admin.dpl.tugaskan-kelompok', $group), [
                'dpl_period_id' => $dplPeriod->id,
            ])
            ->assertRedirect(route('admin.dpl.penugasan'));

        $group->refresh();
        expect($group->dpl_id)->toBe($dosen->id);

        // ── Step 5: Student submits daily report ──────────────────────
        $this->ensureWorkshopCompleted($studentUser);

        PoskoKelompok::create([
            'kelompok_id' => $group->id,
            'latitude' => -7.42440000,
            'longitude' => 109.23070000,
            'photo_path' => 'posko-photos/test-posko.jpg',
            'photo_name' => 'test-posko.jpg',
            'photo_size' => 1024,
            'uploaded_by' => $studentUser->id,
        ]);

        $this->actingAs($studentUser)
            ->postJson(route('student.laporan-harian.store'), [
                'date' => now()->toDateString(),
                'title' => 'Kegiatan Posyandu Desa',
                'activity' => 'Pendampingan kegiatan posyandu di balai desa.',
                'reflection' => 'Koordinasi dengan kader berjalan baik.',
                'output' => 'Data peserta posyandu dan dokumentasi kegiatan.',
                'location_name' => 'Balai Desa',
                'latitude' => '-7.42442000',
                'longitude' => '109.23072000',
                'gps_accuracy' => '18.50',
                'captured_at' => now()->toIso8601String(),
                'location_source' => 'gps',
            ])
            ->assertCreated()
            ->assertJson(['message' => 'Laporan harian berhasil dikirim.']);

        $dailyReport = KegiatanKkn::where('mahasiswa_id', $mahasiswa->id)
            ->where('kelompok_id', $group->id)
            ->firstOrFail();

        expect($dailyReport->status)->toBe('submitted');

        // ── Step 6: DPL approves daily report ─────────────────────────
        $this->actingAs($dplUser)
            ->from(route('dpl.daily-reports.index'))
            ->patch(route('dpl.daily-reports.approve', $dailyReport))
            ->assertRedirect(route('dpl.daily-reports.index'));

        $dailyReport->refresh();
        expect($dailyReport->status)->toBe('approved');

        // ── Step 7: Student submits work program ──────────────────────
        $this->actingAs($studentUser)
            ->post(route('student.program-kerja.store'), [
                'title' => 'Program Kerja Pendidikan Masyarakat',
                'description' => 'Penyuluhan pentingnya pendidikan bagi anak-anak di pedesaan.',
                'objectives' => 'Meningkatkan kesadaran masyarakat tentang pendidikan.',
                'target_participants' => 50,
                'budget' => 500000,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('program_kerja', [
            'kelompok_id' => $group->id,
            'title' => 'Program Kerja Pendidikan Masyarakat',
        ], 'kkn');

        // ── Step 8: DPL evaluates student ─────────────────────────────
        SystemSetting::set('group_male_min_ratio', '20');
        SystemSetting::set('group_male_target_ratio', '30');

        KonfigurasiPenilaian::create([
            'config_key' => 'weight_dpl_report',
            'label' => 'Bobot Laporan Akhir',
            'percentage' => 30,
            'group' => 'main',
        ]);
        KonfigurasiPenilaian::create([
            'config_key' => 'weight_dpl_execution',
            'label' => 'Bobot Pelaksanaan',
            'percentage' => 40,
            'group' => 'main',
        ]);
        KonfigurasiPenilaian::create([
            'config_key' => 'weight_dpl_article',
            'label' => 'Bobot Artikel',
            'percentage' => 30,
            'group' => 'main',
        ]);

        // Submit final report first (required for grading)
        LaporanAkhir::create([
            'mahasiswa_id' => $mahasiswa->id,
            'kelompok_id' => $group->id,
            'title' => 'Laporan Akhir KKN',
            'abstract' => 'Ringkasan kegiatan KKN.',
            'file_path' => 'final-reports/test-final.pdf',
            'file_name' => 'test-final.pdf',
            'status' => 'approved',
            'submitted_at' => now(),
        ]);

        $this->actingAs($dplUser)
            ->post(route('dpl.evaluations.store'), [
                'student_id' => $mahasiswa->id,
                'group_id' => $group->id,
                'evaluator_type' => 'dpl',
                'notes' => 'Penilaian DPL untuk mahasiswa.',
                'items' => [
                    ['criterion' => 'Laporan Akhir', 'score' => 88, 'weight' => 30],
                    ['criterion' => 'Pelaksanaan Program', 'score' => 90, 'weight' => 40],
                    ['criterion' => 'Artikel Ilmiah', 'score' => 86, 'weight' => 30],
                ],
            ])
            ->assertRedirect(route('dpl.evaluations.index'));

        $nilaiKkn = NilaiKkn::where('user_id', $studentUser->id)
            ->where('kelompok_id', $group->id)
            ->firstOrFail();

        expect($nilaiKkn->final_report_score)->toBe('88.00')
            ->and($nilaiKkn->execution_score)->toBe('90.00')
            ->and($nilaiKkn->article_score)->toBe('86.00')
            ->and($nilaiKkn->dpl_graded_at)->not->toBeNull();

        // ── Step 9: Admin finalizes grades ───────────────────────────
        $this->actingAs($admin)
            ->patch(route('admin.grade-reports.finalisasi', $nilaiKkn))
            ->assertRedirect()
            ->assertSessionHas('success');

        $nilaiKkn->refresh();
        expect($nilaiKkn->is_finalized)->toBeTrue();

        // ── Step 10: Student can view their grade ─────────────────────
        $this->actingAs($studentUser)
            ->get(route('student.dashboard'))
            ->assertOk();

        // Verify grade is accessible via the dashboard or grade view
        $finalGrade = NilaiKkn::where('user_id', $studentUser->id)
            ->where('kelompok_id', $group->id)
            ->firstOrFail();

        expect($finalGrade->is_finalized)->toBeTrue()
            ->and($finalGrade->letter_grade)->not->toBeNull()
            ->and($finalGrade->total_score)->not->toBeNull();
    }

    public function test_workflow_requires_approved_registration_before_daily_report(): void
    {
        ['user' => $studentUser, 'mahasiswa' => $mahasiswa] = $this->createStudentUser();

        $period = Periode::factory()->active()->create();
        $location = Lokasi::factory()->create();
        $group = KelompokKkn::factory()->create([
            'period_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'active',
        ]);

        // Register but do NOT approve
        PesertaKkn::factory()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'period_id' => $period->id,
            'kelompok_id' => $group->id,
            'status' => 'pending',
        ]);

        $this->ensureWorkshopCompleted($studentUser);

        // Should fail because registration is not approved
        $this->actingAs($studentUser)
            ->postJson(route('student.laporan-harian.store'), [
                'date' => now()->toDateString(),
                'title' => 'Kegiatan Test',
                'activity' => 'Test activity.',
                'location_name' => 'Test Location',
                'latitude' => '-7.42442000',
                'longitude' => '109.23072000',
                'gps_accuracy' => '18.50',
                'captured_at' => now()->toIso8601String(),
                'location_source' => 'gps',
            ])
            ->assertForbidden();
    }

    public function test_daily_report_cannot_be_reviewed_twice_after_approval(): void
    {
        ['user' => $dplUser, 'dosen' => $dosen] = $this->createDplUser();
        ['user' => $studentUser, 'mahasiswa' => $mahasiswa] = $this->createStudentUser();

        $period = Periode::factory()->active()->create();
        $location = Lokasi::factory()->create();
        $group = KelompokKkn::factory()->create([
            'period_id' => $period->id,
            'location_id' => $location->id,
            'status' => 'active',
        ]);

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $mahasiswa->id,
            'period_id' => $period->id,
            'kelompok_id' => $group->id,
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
        $group->dosen()->syncWithoutDetaching([
            $dosen->id => ['role' => 'Ketua'],
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

        $this->ensureWorkshopCompleted($studentUser);

        // Student submits report
        $this->actingAs($studentUser)
            ->postJson(route('student.laporan-harian.store'), [
                'date' => now()->toDateString(),
                'title' => 'Test Report',
                'activity' => 'Test activity.',
                'location_name' => 'Test Location',
                'latitude' => '-7.42442000',
                'longitude' => '109.23072000',
                'gps_accuracy' => '18.50',
                'captured_at' => now()->toIso8601String(),
                'location_source' => 'gps',
            ])
            ->assertCreated();

        $report = KegiatanKkn::firstOrFail();

        // DPL approves
        $this->actingAs($dplUser)
            ->patch(route('dpl.daily-reports.approve', $report))
            ->assertRedirect();

        // DPL tries to send for revision — should fail
        $this->actingAs($dplUser)
            ->from(route('dpl.daily-reports.show', $report))
            ->patch(route('dpl.daily-reports.revision', $report), [
                'revision_notes' => 'Should not work.',
            ])
            ->assertRedirect()
            ->assertSessionHas('error');

        $report->refresh();
        expect($report->status)->toBe('approved');
    }
}
