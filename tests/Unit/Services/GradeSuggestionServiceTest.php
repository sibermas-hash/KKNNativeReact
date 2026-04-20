<?php

namespace Tests\Unit\Services;

use App\Models\KKN\PesertaKkn;
use App\Services\GradeSuggestionService;
use App\Services\GradingService;
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

        $gradingServiceMock = $this->mock(GradingService::class, function ($mock) use ($peserta) {
            $mock->shouldReceive('getAiPerformanceSummary')
                ->with($peserta->mahasiswa_id)
                ->once()
                ->andReturn([
                    'has_data' => false,
                ]);
        });

        $result = $this->service->suggestGrade($peserta->id);

        $this->assertSame(0, $result['score']);
        $this->assertSame('E', $result['label']);
        $this->assertStringContainsString('Tidak ada aktivitas laporan', $result['reason']);
        $this->assertSame(0, $result['metrics']['completion']);
        $this->assertSame(0, $result['metrics']['ai_quality']);
    }

    public function test_grade_calculation_with_ai_summary(): void
    {
        $peserta = PesertaKkn::factory()->create();

        $gradingServiceMock = $this->mock(GradingService::class, function ($mock) use ($peserta) {
            $mock->shouldReceive('getAiPerformanceSummary')
                ->with($peserta->mahasiswa_id)
                ->once()
                ->andReturn([
                    'has_data' => true,
                    'suggested_admin_score' => 92.5,
                    'avg_compliance' => 9.5,
                    'avg_quality' => 8.8,
                    'total_reports' => 35,
                    'top_tags' => ['Pendidikan', 'Kesehatan'],
                ]);
        });

        $result = $this->service->suggestGrade($peserta->id);

        $this->assertSame(92.5, $result['score']);
        $this->assertSame('A', $result['label']);
        $this->assertStringContainsString('9.5', $result['reason']);
        $this->assertStringContainsString('35', $result['reason']);
        $this->assertSame(9.5, $result['metrics']['compliance']);
        $this->assertSame(8.8, $result['metrics']['quality']);
        $this->assertSame(35, $result['metrics']['reports']);
        $this->assertSame(['Pendidikan', 'Kesehatan'], $result['metrics']['tags']);
    }

    public function test_grade_label_b_for_score_75(): void
    {
        $peserta = PesertaKkn::factory()->create();

        $gradingServiceMock = $this->mock(GradingService::class, function ($mock) use ($peserta) {
            $mock->shouldReceive('getAiPerformanceSummary')
                ->with($peserta->mahasiswa_id)
                ->once()
                ->andReturn([
                    'has_data' => true,
                    'suggested_admin_score' => 75.0,
                    'avg_compliance' => 7.0,
                    'avg_quality' => 7.5,
                    'total_reports' => 20,
                    'top_tags' => [],
                ]);
        });

        $result = $this->service->suggestGrade($peserta->id);

        $this->assertSame(75.0, $result['score']);
        // 75 biasanya B (berdasarkan GradeConversionService standard)
        $this->assertContains($result['label'], ['B', 'B+', 'B-']);
    }
}
