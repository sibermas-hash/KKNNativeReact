<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FinalReportStateMachineTest extends TestCase
{
    public function test_student_can_resubmit_final_report_after_revision_requested(): void
    {
        Storage::fake('local');

        $studentUser = User::factory()->create([
            'username' => 'student_final_report_revision',
        ]);
        $studentUser->assignRole('student');

        $student = Mahasiswa::factory()->create([
            'user_id' => $studentUser->id,
        ]);

        $period = Periode::factory()->grading()->create();
        $group = KelompokKkn::factory()->create([
            'periode_id' => $period->id,
            'location_id' => Lokasi::factory(),
        ]);

        PesertaKkn::factory()->approved()->create([
            'mahasiswa_id' => $student->id,
            'periode_id' => $period->id,
            'kelompok_id' => $group->id,
            'role' => 'Ketua',
        ]);

        Storage::disk('local')->put('final-reports/old-report.pdf', '%PDF-1.4 old report');
        Storage::disk('local')->put('final-reports/articles/old-article.pdf', '%PDF-1.4 old article');

        $report = LaporanAkhir::create([
            'mahasiswa_id' => $student->id,
            'kelompok_id' => $group->id,
            'title' => 'Laporan Awal',
            'abstract' => 'Abstrak lama.',
            'video_link' => 'https://example.com/video-lama',
            'news_link' => 'https://example.com/berita-lama',
            'file_path' => 'final-reports/old-report.pdf',
            'file_name' => 'old-report.pdf',
            'article_1_path' => 'final-reports/articles/old-article.pdf',
            'status' => 'revision',
            'review_notes' => 'Perbaiki abstrak dan unggah dokumen terbaru.',
            'submitted_at' => now()->subDay(),
            'reviewed_at' => now()->subHours(12),
            'reviewed_by' => User::factory()->create()->id,
        ]);

        $response = $this->actingAs($studentUser)
            ->post(route('student.laporan-akhir.store'), [
                'title' => 'Laporan Revisi Final',
                'abstract' => 'Abstrak yang sudah diperbarui.',
                'video_link' => 'https://example.com/video-baru',
                'news_link' => 'https://example.com/berita-baru',
                'file' => UploadedFile::fake()->createWithContent(
                    'laporan-revisi.pdf',
                    "%PDF-1.4\nrevised final report"
                ),
            ]);

        $response->assertRedirect(route('student.dashboard'));

        $report->refresh();

        $this->assertSame('submitted', $report->status);
        $this->assertSame('Laporan Revisi Final', $report->title);
        $this->assertSame('Abstrak yang sudah diperbarui.', $report->abstract);
        $this->assertSame('https://example.com/video-baru', $report->video_link);
        $this->assertSame('https://example.com/berita-baru', $report->news_link);
        $this->assertNull($report->review_notes);
        $this->assertNull($report->reviewed_by);
        $this->assertNull($report->reviewed_at);
        $this->assertSame('final-reports/articles/old-article.pdf', $report->article_1_path);
        $this->assertNotSame('final-reports/old-report.pdf', $report->file_path);

        Storage::disk('local')->assertMissing('final-reports/old-report.pdf');
        Storage::disk('local')->assertExists($report->file_path);
        $this->assertSame(1, LaporanAkhir::where('kelompok_id', $group->id)->count());
    }

    public function test_admin_can_update_final_report_status_using_canonical_workflow_values(): void
    {
        $admin = User::factory()->create([
            'username' => 'admin_final_report_workflow',
        ]);
        $admin->assignRole('admin');

        $student = Mahasiswa::factory()->create();
        $group = KelompokKkn::factory()->create([
            'location_id' => Lokasi::factory(),
        ]);

        $report = LaporanAkhir::factory()->create([
            'mahasiswa_id' => $student->id,
            'kelompok_id' => $group->id,
            'status' => 'submitted',
        ]);

        $this->from(route('admin.laporan.akhir.show', $report))
            ->actingAs($admin)
            ->patch(route('admin.laporan.akhir.update-status', $report), [
                'status' => 'revision',
                'review_notes' => 'Mohon rapikan bagian kesimpulan dan lampiran.',
            ])
            ->assertRedirect(route('admin.laporan.akhir.show', $report));

        $report->refresh();

        $this->assertSame('revision', $report->status);
        $this->assertSame('Mohon rapikan bagian kesimpulan dan lampiran.', $report->review_notes);
        $this->assertSame($admin->id, $report->reviewed_by);
        $this->assertNotNull($report->reviewed_at);
    }
}
