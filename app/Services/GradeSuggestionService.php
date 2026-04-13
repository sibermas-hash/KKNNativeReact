<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\PesertaKkn;
use App\Services\KKN\GradeConversionService;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class GradeSuggestionService
{
    /**
     * Suggest a grade based on REAL AI Audit scores (L13 AI SDK Integration)
     */
    public function suggestGrade(int $pesertaKknId): array
    {
        $peserta = PesertaKkn::findOrFail($pesertaKknId);
        
        // Use the new Modern Grading Service (AI Powered)
        $aiSummary = app(GradingService::class)->getAiPerformanceSummary($peserta->mahasiswa_id);

        if (!$aiSummary['has_data']) {
            return [
                'score' => 0,
                'label' => 'E',
                'reason' => 'Tidak ada aktivitas laporan harian dengan audit AI ditemukan.',
                'metrics' => ['completion' => 0, 'ai_quality' => 0],
            ];
        }

        // Calculate score based on actual AI Audit results
        // Compliance (ABCD) and Quality are the gold standard for KKN 56
        $finalScore = $aiSummary['suggested_admin_score'];
        $gradeData = GradeConversionService::convert($finalScore);

        return [
            'score' => $finalScore,
            'label' => $gradeData['grade'],
            'reason' => "Analisis berbasis {$aiSummary['total_reports']} laporan harian yang telah terverifikasi AI. Rata-rata kepatuhan ABCD: {$aiSummary['avg_compliance']}/10.",
            'metrics' => [
                'compliance' => $aiSummary['avg_compliance'],
                'quality' => $aiSummary['avg_quality'],
                'reports' => $aiSummary['total_reports'],
                'tags' => $aiSummary['top_tags'],
            ],
        ];
    }
}
