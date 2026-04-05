<?php

namespace App\Services;

use App\Models\KKN\Laporan;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class QualityAuditService
{
    /**
     * Patterns that indicate generic or placeholder content
     */
    protected array $placeholders = [
        'lorem ipsum',
        'kegiatan hari ini',
        'melaksanakan kkn',
        'membantu masyarakat',
        '---',
        '...',
        'test',
        'asdf',
    ];

    /**
     * Audit a single report
     */
    public function auditReport(Laporan $report): array
    {
        $riskScore = 0;
        $flags = [];
        $text = Str::lower($report->description ?? '');
        $wordCount = str_word_count($text);

        // Rule 1: Short content
        if ($wordCount < 10) {
            $riskScore += 40;
            $flags[] = 'REPORT_TOO_SHORT';
        } elseif ($wordCount < 25) {
            $riskScore += 15;
            $flags[] = 'LOW_DETAIL_LEVEL';
        }

        // Rule 2: Placeholder detection
        foreach ($this->placeholders as $placeholder) {
            if (str_contains($text, $placeholder)) {
                $riskScore += 30;
                $flags[] = 'GENERIC_CONTENT_DETECTED';
                break;
            }
        }

        // Rule 3: Late submission (more than 3 days after activity date)
        // If we have activity_date column, otherwise skip
        // Note: Laporan has submitted_at

        return [
            'risk_score' => min(100, $riskScore),
            'flags' => $flags,
            'level' => $this->getRiskLevel($riskScore),
        ];
    }

    /**
     * Detect duplicated content within a group
     */
    public function detectDuplicates(int $kelompokId): Collection
    {
        $reports = Laporan::where('kelompok_id', $kelompokId)
            ->whereNotNull('description')
            ->select('id', 'user_id', 'description', 'submitted_at')
            ->get();

        $duplicates = collect();

        foreach ($reports as $i => $reportA) {
            foreach ($reports as $j => $reportB) {
                if ($i >= $j) continue; // Avoid redundant checks
                if ($reportA->user_id === $reportB->user_id) continue; // Same user, different days is expected

                $similarity = 0;
                similar_text($reportA->description, $reportB->description, $similarity);

                if ($similarity > 85) {
                    $duplicates->push([
                        'report_a_id' => $reportA->id,
                        'report_b_id' => $reportB->id,
                        'similarity' => round($similarity, 2),
                    ]);
                }
            }
        }

        return $duplicates;
    }

    protected function getRiskLevel(int $score): string
    {
        if ($score >= 70) return 'HIGH';
        if ($score >= 30) return 'MEDIUM';
        return 'LOW';
    }
}
