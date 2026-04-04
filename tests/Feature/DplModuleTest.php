<?php

namespace Tests\Feature;

use App\Models\KKN\Dosen;
use App\Models\KKN\FileKegiatanKkn;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DplModuleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'dpl', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
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

        $period = Periode::factory()->active()->create();
        $group = KelompokKkn::factory()->create([
            'period_id' => $period->id,
            'location_id' => Lokasi::factory(),
            'dpl_id' => $dosen->id,
        ]);

        $group->dosen()->syncWithoutDetaching([$dosen->id => ['role' => 'Ketua']]);
        $group->syncKetuaFlatColumns();

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $student->id,
            'period_id' => $period->id,
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
            ->get(route('dpl.groups.index'))
            ->assertOk()
            ->assertSee($context['group']->code);

        $this->actingAs($context['dplUser'])
            ->get(route('dpl.groups.show', $context['group']))
            ->assertOk()
            ->assertSee($context['student']->nama);
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
            ->patch(route('dpl.daily-reports.approve', $context['dailyReport']))
            ->assertRedirect();

        $this->assertDatabaseHas('kegiatan_kkn', [
            'id' => $context['dailyReport']->id,
            'status' => 'approved',
        ], 'kkn');
    }

    public function test_dpl_can_send_daily_report_revision(): void
    {
        $context = $this->createDplScenario();

        $this->actingAs($context['dplUser'])
            ->patch(route('dpl.daily-reports.revision', $context['dailyReport']), [
                'revision_notes' => 'Mohon lengkapi dokumentasi kegiatan.',
            ])
            ->assertRedirect();

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
            ->patch(route('dpl.final-reports.approve', $context['finalReport']))
            ->assertRedirect();

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
}
