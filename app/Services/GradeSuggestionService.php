<?php

namespace App\Services;

use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\PesertaKkn;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class GradeSuggestionService
{
    /**
     * Suggest a grade based on daily report activity and sentiment
     */
    public function suggestGrade(int $pesertaKknId): array
    {
        $peserta = PesertaKkn::with('mahasiswa.kegiatan')->findOrFail($pesertaKknId);
        $reports = $peserta->mahasiswa?->kegiatan ?? new Collection();
        
        if ($reports->isEmpty()) {
            return [
                'score' => 0,
                'label' => 'E',
                'reason' => 'Tidak ada aktivitas laporan harian ditemukan.',
                'metrics' => ['completion' => 0, 'sentiment' => 0]
            ];
        }

        // 1. Completion Rate (Out of 40 days target)
        $targetDays = 40;
        $actualDays = $reports->count();
        $completionScore = min(100, ($actualDays / $targetDays) * 100);

        // 2. Mock Sentiment Analysis
        $positiveWords = ['berhasil', 'lancar', 'antusias', 'partisipasi', 'sukses', 'bermanfaat', 'kolaborasi'];
        $negativeWords = ['kendala', 'sulit', 'hambatan', 'kurang', 'gagal', 'menolak', 'konflik'];
        
        $sentimentScore = 70; // Baseline
        
        foreach ($reports as $report) {
            $content = Str::lower(implode(' ', array_filter([
                $report->title,
                $report->activity,
                $report->reflection,
                $report->output,
            ])));
            foreach ($positiveWords as $word) {
                if (Str::contains($content, $word)) $sentimentScore += 0.5;
            }
            foreach ($negativeWords as $word) {
                if (Str::contains($content, $word)) $sentimentScore -= 0.5;
            }
        }
        
        $sentimentScore = max(0, min(100, $sentimentScore));
        
        // 3. Final Calculation
        $finalScore = ($completionScore * 0.7) + ($sentimentScore * 0.3);
        
        $grade = $this->calculateGradeLabel($finalScore);

        return [
            'score' => round($finalScore, 2),
            'label' => $grade,
            'reason' => "Analisis berbasis {$actualDays} laporan harian dengan tingkat keberhasilan program yang tinggi.",
            'metrics' => [
                'completion' => round($completionScore, 1),
                'sentiment' => round($sentimentScore, 1)
            ]
        ];
    }

    private function calculateGradeLabel(float $score): string
    {
        if ($score >= 85) return 'A';
        if ($score >= 80) return 'A-';
        if ($score >= 75) return 'B+';
        if ($score >= 70) return 'B';
        if ($score >= 65) return 'B-';
        if ($score >= 60) return 'C+';
        if ($score >= 55) return 'C';
        return 'D/E';
    }
}
