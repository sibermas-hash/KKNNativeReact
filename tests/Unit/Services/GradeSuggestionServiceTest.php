<?php

namespace Tests\Unit\Services;

use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\PesertaKkn;
use App\Services\GradeSuggestionService;
use Tests\TestCase;

class GradeSuggestionServiceTest extends TestCase
{
    private GradeSuggestionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new GradeSuggestionService;
    }

    public function test_returns_zero_score_when_no_reports(): void
    {
        $peserta = PesertaKkn::factory()->create();

        $result = $this->service->suggestGrade($peserta->id);

        $this->assertSame(0, $result['score']);
        $this->assertSame('E', $result['label']);
        $this->assertSame('Tidak ada aktivitas laporan harian ditemukan.', $result['reason']);
        $this->assertSame(0, $result['metrics']['completion']);
        $this->assertSame(0, $result['metrics']['sentiment']);
    }

    public function test_completion_score_calculation(): void
    {
        $peserta = PesertaKkn::factory()->create();

        // Create 20 reports (50% of 40-day target)
        KegiatanKkn::factory()->count(20)->create([
            'mahasiswa_id' => $peserta->mahasiswa_id,
        ]);

        $result = $this->service->suggestGrade($peserta->id);

        // completionScore = (20/40) * 100 = 50
        // sentimentScore = 70 (baseline)
        // finalScore = (50 * 0.7) + (70 * 0.3) = 35 + 21 = 56
        $this->assertSame(56.0, $result['score']);
        $this->assertSame(50.0, $result['metrics']['completion']);
        $this->assertSame(70.0, $result['metrics']['sentiment']);
    }

    public function test_perfect_completion_yields_high_score(): void
    {
        $peserta = PesertaKkn::factory()->create();

        // Create 40 reports (100% of target)
        KegiatanKkn::factory()->count(40)->create([
            'mahasiswa_id' => $peserta->mahasiswa_id,
        ]);

        $result = $this->service->suggestGrade($peserta->id);

        // completionScore = 100 (capped)
        // sentimentScore = 70 (baseline)
        // finalScore = (100 * 0.7) + (70 * 0.3) = 70 + 21 = 91
        $this->assertSame(91.0, $result['score']);
        $this->assertSame('A', $result['label']);
    }

    public function test_positive_words_increase_sentiment(): void
    {
        $peserta = PesertaKkn::factory()->create();

        KegiatanKkn::factory()->create([
            'mahasiswa_id' => $peserta->mahasiswa_id,
            'activity' => 'Kegiatan berjalan berhasil dan lancar dengan antusias mahasiswa',
        ]);

        $result = $this->service->suggestGrade($peserta->id);

        // Baseline sentiment is 70, each positive word adds 0.5
        // "berhasil", "lancar", "antusias" = 3 positive words = +1.5
        $this->assertGreaterThan(70, $result['metrics']['sentiment']);
    }

    public function test_negative_words_decrease_sentiment(): void
    {
        $peserta = PesertaKkn::factory()->create();

        KegiatanKkn::factory()->create([
            'mahasiswa_id' => $peserta->mahasiswa_id,
            'activity' => 'Terdapat kendala dan hambatan yang sulit diatasi',
        ]);

        $result = $this->service->suggestGrade($peserta->id);

        // Baseline sentiment is 70, each negative word subtracts 0.5
        // "kendala", "hambatan", "sulit" = 3 negative words = -1.5
        $this->assertLessThan(70, $result['metrics']['sentiment']);
    }

    public function test_sentiment_score_capped_at_100(): void
    {
        $peserta = PesertaKkn::factory()->create();

        // Create many reports with positive words
        for ($i = 0; $i < 40; $i++) {
            KegiatanKkn::factory()->create([
                'mahasiswa_id' => $peserta->mahasiswa_id,
                'activity' => 'Berhasil lancar antusias berpartisipasi sukses bermanfaat kolaborasi',
            ]);
        }

        $result = $this->service->suggestGrade($peserta->id);

        $this->assertLessThanOrEqual(100, $result['metrics']['sentiment']);
    }

    public function test_sentiment_score_capped_at_zero(): void
    {
        $peserta = PesertaKkn::factory()->create();

        // Create reports with many negative words
        $negativeContent = str_repeat('kendala sulit hambatan kurang gagal menolak konflik ', 30);
        KegiatanKkn::factory()->create([
            'mahasiswa_id' => $peserta->mahasiswa_id,
            'activity' => $negativeContent,
        ]);

        $result = $this->service->suggestGrade($peserta->id);

        $this->assertGreaterThanOrEqual(0, $result['metrics']['sentiment']);
    }

    public function test_grade_label_a_for_score_85_and_above(): void
    {
        $peserta = PesertaKkn::factory()->create();

        // 40 reports = 100% completion
        KegiatanKkn::factory()->count(40)->create([
            'mahasiswa_id' => $peserta->mahasiswa_id,
        ]);

        $result = $this->service->suggestGrade($peserta->id);

        $this->assertSame('A', $result['label']);
    }

    public function test_grade_label_calculation_with_low_completion(): void
    {
        $peserta = PesertaKkn::factory()->create();

        // Only 5 reports = 12.5% completion
        KegiatanKkn::factory()->count(5)->create([
            'mahasiswa_id' => $peserta->mahasiswa_id,
        ]);

        $result = $this->service->suggestGrade($peserta->id);

        // completionScore = 12.5
        // sentimentScore = 70
        // finalScore = (12.5 * 0.7) + (70 * 0.3) = 8.75 + 21 = 29.75
        $this->assertSame(29.75, $result['score']);
        $this->assertSame('E', $result['label']);
    }

    public function test_reason_includes_report_count(): void
    {
        $peserta = PesertaKkn::factory()->create();

        KegiatanKkn::factory()->count(15)->create([
            'mahasiswa_id' => $peserta->mahasiswa_id,
        ]);

        $result = $this->service->suggestGrade($peserta->id);

        $this->assertStringContainsString('15 laporan', $result['reason']);
    }

    public function test_metrics_are_rounded(): void
    {
        $peserta = PesertaKkn::factory()->create();

        // Create 13 reports
        KegiatanKkn::factory()->count(13)->create([
            'mahasiswa_id' => $peserta->mahasiswa_id,
        ]);

        $result = $this->service->suggestGrade($peserta->id);

        // completionScore = (13/40) * 100 = 32.5
        $this->assertSame(32.5, $result['metrics']['completion']);
        // sentimentScore = 70
        $this->assertSame(70.0, $result['metrics']['sentiment']);
        // finalScore = (32.5 * 0.7) + (70 * 0.3) = 22.75 + 21 = 43.75
        $this->assertSame(43.75, $result['score']);
    }

    public function test_weight_calculation_is_correct(): void
    {
        $peserta = PesertaKkn::factory()->create();

        // Create 30 reports = 75% completion
        KegiatanKkn::factory()->count(30)->create([
            'mahasiswa_id' => $peserta->mahasiswa_id,
        ]);

        $result = $this->service->suggestGrade($peserta->id);

        // completionScore = 75
        // sentimentScore = 70
        // finalScore = (75 * 0.7) + (70 * 0.3) = 52.5 + 21 = 73.5
        $expectedScore = (75 * 0.7) + (70 * 0.3);

        $this->assertSame(round($expectedScore, 2), $result['score']);
    }

    public function test_exceeding_target_still_capped_at_100(): void
    {
        $peserta = PesertaKkn::factory()->create();

        // Create 60 reports (150% of target)
        KegiatanKkn::factory()->count(60)->create([
            'mahasiswa_id' => $peserta->mahasiswa_id,
        ]);

        $result = $this->service->suggestGrade($peserta->id);

        // completionScore should be capped at 100
        $this->assertSame(100.0, $result['metrics']['completion']);
    }

    public function test_single_report(): void
    {
        $peserta = PesertaKkn::factory()->create();

        KegiatanKkn::factory()->create([
            'mahasiswa_id' => $peserta->mahasiswa_id,
            'activity' => 'Kegiatan berjalan lancar',
        ]);

        $result = $this->service->suggestGrade($peserta->id);

        // completionScore = (1/40) * 100 = 2.5
        // sentimentScore = 70 + 0.5 (lancar) = 70.5
        // finalScore = (2.5 * 0.7) + (70.5 * 0.3) = 1.75 + 21.15 = 22.9
        $this->assertGreaterThan(0, $result['score']);
        $this->assertArrayHasKey('label', $result);
        $this->assertArrayHasKey('metrics', $result);
    }

    public function test_mixed_positive_and_negative_words(): void
    {
        $peserta = PesertaKkn::factory()->create();

        KegiatanKkn::factory()->create([
            'mahasiswa_id' => $peserta->mahasiswa_id,
            'activity' => 'Berhasil namun ada kendala yang sulit',
        ]);

        $result = $this->service->suggestGrade($peserta->id);

        // 1 positive (berhasil) = +0.5
        // 2 negative (kendala, sulit) = -1.0
        // Net = 70 + 0.5 - 1.0 = 69.5
        $this->assertSame(69.5, $result['metrics']['sentiment']);
    }

    public function test_case_insensitive_word_matching(): void
    {
        $peserta = PesertaKkn::factory()->create();

        KegiatanKkn::factory()->create([
            'mahasiswa_id' => $peserta->mahasiswa_id,
            'activity' => 'BERHASIL dan LANCAR',
        ]);

        $result = $this->service->suggestGrade($peserta->id);

        // Should still detect positive words (case-insensitive via Str::lower)
        $this->assertGreaterThan(70, $result['metrics']['sentiment']);
    }
}
