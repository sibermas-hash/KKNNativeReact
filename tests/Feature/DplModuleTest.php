<?php

namespace Tests\Feature;

use App\Models\KKN\Dosen;
use App\Models\KKN\DplKecamatanAssignment;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\FileKegiatanKkn;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\MonitoringDpl;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DplModuleTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'dpl', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
    }

    private function createDplScenario(array $overrides = []): array
    {
        Storage::fake('local');

        $dplUser = User::factory()->create([
            'username' => $overrides['dpl_username'] ?? 'dpl-test',
        ]);
        $dplUser->assignRole('dpl');

        $dosen = Dosen::factory()->create([
            'user_id' => $dplUser->id,
        ]);

        $student = Mahasiswa::factory()->create();
        $student->user->assignRole('student');

        $period = Periode::factory()->grading()->create();
        $group = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'location_id' => Lokasi::factory(),
            'dpl_id' => $dosen->id,
        ]);

        $group->dosen()->syncWithoutDetaching([$dosen->id => ['role' => 'Ketua']]);
        $group->syncKetuaFlatColumns();

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $student->id,
            'periode_id' => $period->id,
            'kelompok_id' => $group->id,
            'role' => 'Ketua',
        ]);

        $dailyReport = KegiatanKkn::create([
            'mahasiswa_id' => $student->id,
            'kelompok_id' => $group->id,
            'date' => now()->toDateString(),
            'title' => 'Laporan Harian DPL',
            'activity' => 'Mahasiswa melakukan kegiatan lapangan.',
            'output' => 'Dokumentasi selesai.',
            'status' => 'submitted',
            'latitude' => -7.4244,
            'longitude' => 109.2307,
        ]);

        Storage::disk('local')->put('daily-reports/dpl-test.pdf', 'daily report attachment');
        $attachment = FileKegiatanKkn::create([
            'kegiatan_kkn_id' => $dailyReport->id,
            'file_path' => 'daily-reports/dpl-test.pdf',
            'file_name' => 'dpl-test.pdf',
        ]);

        Storage::disk('local')->put('final-reports/dpl-final-report.pdf', 'final report attachment');
        $finalReport = LaporanAkhir::create([
            'mahasiswa_id' => $student->id,
            'kelompok_id' => $group->id,
            'title' => 'Laporan Akhir DPL',
            'abstract' => 'Ringkasan laporan akhir mahasiswa.',
            'file_path' => 'final-reports/dpl-final-report.pdf',
            'file_name' => 'dpl-final-report.pdf',
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        return compact('dplUser', 'dosen', 'student', 'period', 'group', 'dailyReport', 'attachment', 'finalReport');
    }

    public function test_dpl_can_open_dashboard_and_group_pages(): void
    {
        $context = $this->createDplScenario();

        $this->actingAs($context['dplUser'])
            ->get(route('dpl.dashboard'))
            ->assertOk();

        $this->actingAs($context['dplUser'])
            ->get(route('dpl.kelompok.index'))
            ->assertOk()
            ->assertSee($context['group']->code);

        $this->actingAs($context['dplUser'])
            ->get(route('dpl.kelompok.show', $context['group']))
            ->assertOk()
            ->assertSee($context['student']->nama);
    }

    public function test_dpl_dashboard_shows_coordinator_area_summary(): void
    {
        $context = $this->createDplScenario();

        $dplPeriod = DplPeriod::create([
            'dosen_id' => $context['dosen']->id,
            'periode_id' => $context['period']->id,
            'max_groups' => 5,
            'is_active' => true,
        ]);

        DplKecamatanAssignment::create([
            'dpl_periode_id' => $dplPeriod->id,
            'dosen_id' => $context['dosen']->id,
            'periode_id' => $context['period']->id,
            'district_id' => $context['group']->lokasi->district_id,
            'district_name' => $context['group']->lokasi->district_name,
            'regency_name' => $context['group']->lokasi->regency_name,
            'is_active' => true,
        ]);

        $this->actingAs($context['dplUser'])
            ->get(route('dpl.dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dpl/Dashboard')
                ->has('coordinatorAreas', 1)
                ->where('coordinatorAreas.0.district_name', $context['group']->lokasi->district_name)
            );
    }

    public function test_dpl_can_open_evaluations_index_for_owned_group(): void
    {
        $context = $this->createDplScenario();

        $this->actingAs($context['dplUser'])
            ->get(route('dpl.evaluations.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dpl/Evaluations/Index')
                ->has('groups', 1)
                ->where('groups.0.id', $context['group']->id)
                ->where('groups.0.students.0.name', $context['student']->nama)
            );
    }

    public function test_dpl_can_review_daily_reports_and_download_attachments(): void
    {
        $context = $this->createDplScenario();

        $this->actingAs($context['dplUser'])
            ->get(route('dpl.daily-reports.index'))
            ->assertOk()
            ->assertSee('Laporan Harian DPL');

        $this->actingAs($context['dplUser'])
            ->get(route('dpl.daily-reports.show', $context['dailyReport']))
            ->assertOk()
            ->assertSee('Mahasiswa melakukan kegiatan lapangan.');

        $this->actingAs($context['dplUser'])
            ->get(route('dpl.daily-reports.files.download', $context['attachment']))
            ->assertOk();

        $this->actingAs($context['dplUser'])
            ->from(route('dpl.daily-reports.index'))
            ->patch(route('dpl.daily-reports.approve', $context['dailyReport']))
            ->assertRedirect(route('dpl.daily-reports.index'));

        $this->assertDatabaseHas('kegiatan_kkn', [
            'id' => $context['dailyReport']->id,
            'status' => 'approved',
        ], 'kkn');
    }

    public function test_dpl_can_send_daily_report_revision(): void
    {
        $context = $this->createDplScenario();

        $this->from(route('dpl.daily-reports.show', $context['dailyReport']))
            ->actingAs($context['dplUser'])
            ->patch(route('dpl.daily-reports.revision', $context['dailyReport']), [
                'revision_notes' => 'Mohon lengkapi dokumentasi kegiatan.',
            ])
            ->assertRedirect(route('dpl.daily-reports.show', $context['dailyReport']));

        $this->assertDatabaseHas('kegiatan_kkn', [
            'id' => $context['dailyReport']->id,
            'status' => 'revision',
            'review_notes' => 'Mohon lengkapi dokumentasi kegiatan.',
        ], 'kkn');
    }

    public function test_dpl_can_review_final_reports_and_download_document(): void
    {
        $context = $this->createDplScenario();

        $this->actingAs($context['dplUser'])
            ->get(route('dpl.final-reports.index'))
            ->assertOk()
            ->assertSee('Laporan Akhir DPL');

        $this->actingAs($context['dplUser'])
            ->get(route('dpl.final-reports.show', $context['finalReport']))
            ->assertOk()
            ->assertSee('Ringkasan laporan akhir mahasiswa.');

        $this->actingAs($context['dplUser'])
            ->get(route('dpl.final-reports.download', $context['finalReport']))
            ->assertOk();

        $this->actingAs($context['dplUser'])
            ->from(route('dpl.final-reports.index'))
            ->patch(route('dpl.final-reports.approve', $context['finalReport']))
            ->assertRedirect(route('dpl.final-reports.index'));

        $this->assertDatabaseHas('laporan_akhir', [
            'id' => $context['finalReport']->id,
            'status' => 'approved',
        ], 'kkn');
    }

    public function test_dpl_cannot_access_reports_from_other_groups(): void
    {
        $ownerContext = $this->createDplScenario(['dpl_username' => 'dpl-owner']);
        $foreignContext = $this->createDplScenario(['dpl_username' => 'dpl-foreign']);

        $this->actingAs($ownerContext['dplUser'])
            ->get(route('dpl.daily-reports.show', $foreignContext['dailyReport']))
            ->assertForbidden();

        $this->actingAs($ownerContext['dplUser'])
            ->get(route('dpl.final-reports.show', $foreignContext['finalReport']))
            ->assertForbidden();
    }

    public function test_dpl_manual_evaluation_updates_dpl_component_in_unified_score(): void
    {
        $context = $this->createDplScenario();

        MonitoringDpl::create([
            'dpl_id' => $context['dosen']->id,
            'kelompok_id' => $context['group']->id,
            'periode_id' => $context['period']->id,
            'tanggal_kunjungan' => now()->subDays(2),
            'permasalahan' => 'Tidak ada',
            'solusi' => 'Baik',
            'catatan_tambahan' => 'Lanjutkan',
        ]);
        MonitoringDpl::create([
            'dpl_id' => $context['dosen']->id,
            'kelompok_id' => $context['group']->id,
            'periode_id' => $context['period']->id,
            'tanggal_kunjungan' => now()->subDay(),
            'permasalahan' => 'Tidak ada',
            'solusi' => 'Baik',
            'catatan_tambahan' => 'Lanjutkan',
        ]);

        $this->actingAs($context['dplUser'])
            ->post(route('dpl.evaluations.store'), [
                'student_id' => $context['student']->id,
                'group_id' => $context['group']->id,
                'evaluator_type' => 'dpl',
                'notes' => 'Penilaian DPL manual.',
                'items' => [
                    ['criterion' => 'Laporan Akhir', 'score' => 88, 'weight' => 30],
                    ['criterion' => 'Pelaksanaan Program', 'score' => 90, 'weight' => 40],
                    ['criterion' => 'Artikel Ilmiah', 'score' => 86, 'weight' => 30],
                ],
            ])
            ->assertRedirect(route('dpl.evaluations.index'));

        $score = NilaiKkn::query()
            ->where('user_id', $context['student']->user_id)
            ->where('kelompok_id', $context['group']->id)
            ->first();

        $this->assertNotNull($score);
        $this->assertSame(88.0, (float) $score->final_report_score);
        $this->assertSame(90.0, (float) $score->execution_score);
        $this->assertSame(86.0, (float) $score->article_score);
        $this->assertNotNull($score->dpl_graded_at);
        $this->assertNull($score->village_graded_at);
    }

    public function test_dpl_cannot_manually_evaluate_student_outside_selected_group(): void
    {
        $context = $this->createDplScenario();
        $outsider = Mahasiswa::factory()->create();
        $outsider->user->assignRole('student');

        $this->from(route('dpl.evaluations.index'))
            ->actingAs($context['dplUser'])
            ->post(route('dpl.evaluations.store'), [
                'student_id' => $outsider->id,
                'group_id' => $context['group']->id,
                'evaluator_type' => 'dpl',
                'notes' => 'Seharusnya ditolak.',
                'items' => [
                    ['criterion' => 'Laporan Akhir', 'score' => 88, 'weight' => 30],
                    ['criterion' => 'Pelaksanaan Program', 'score' => 90, 'weight' => 40],
                    ['criterion' => 'Artikel Ilmiah', 'score' => 86, 'weight' => 30],
                ],
            ])
            ->assertRedirect(route('dpl.evaluations.index'))
            ->assertSessionHasErrors('student_id');

        $this->assertDatabaseMissing('evaluasi', [
            'mahasiswa_id' => $outsider->id,
            'kelompok_id' => $context['group']->id,
        ], 'kkn');
    }

    public function test_dpl_cannot_re_review_approved_daily_report(): void
    {
        $context = $this->createDplScenario();

        $this->actingAs($context['dplUser'])
            ->from(route('dpl.daily-reports.show', $context['dailyReport']))
            ->patch(route('dpl.daily-reports.approve', $context['dailyReport']))
            ->assertRedirect(route('dpl.daily-reports.show', $context['dailyReport']));

        $this->from(route('dpl.daily-reports.show', $context['dailyReport']))
            ->actingAs($context['dplUser'])
            ->patch(route('dpl.daily-reports.revision', $context['dailyReport']), [
                'revision_notes' => 'Tidak boleh berubah lagi.',
            ])
            ->assertRedirect(route('dpl.daily-reports.show', $context['dailyReport']))
            ->assertSessionHas('error');

        $this->assertDatabaseHas('kegiatan_kkn', [
            'id' => $context['dailyReport']->id,
            'status' => 'approved',
        ], 'kkn');
    }

    public function test_dpl_cannot_re_review_approved_final_report(): void
    {
        $context = $this->createDplScenario();

        $this->actingAs($context['dplUser'])
            ->from(route('dpl.final-reports.show', $context['finalReport']))
            ->patch(route('dpl.final-reports.approve', $context['finalReport']))
            ->assertRedirect(route('dpl.final-reports.show', $context['finalReport']));

        $this->from(route('dpl.final-reports.show', $context['finalReport']))
            ->actingAs($context['dplUser'])
            ->patch(route('dpl.final-reports.revision', $context['finalReport']), [
                'notes' => 'Tidak boleh berubah lagi.',
            ])
            ->assertRedirect(route('dpl.final-reports.show', $context['finalReport']))
            ->assertSessionHas('error');

        $this->assertDatabaseHas('laporan_akhir', [
            'id' => $context['finalReport']->id,
            'status' => 'approved',
        ], 'kkn');
    }
}
