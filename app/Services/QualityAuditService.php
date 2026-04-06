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
            $riskScore += 50; // Increased weight
            $flags[] = 'CRITICAL_LOW_DETAIL';
        } elseif ($wordCount < 25) {
            $riskScore += 20;
            $flags[] = 'MINIMAL_DETAIL';
        }

        // Rule 2: Placeholder detection
        foreach ($this->placeholders as $placeholder) {
            if (str_contains($text, $placeholder)) {
                $riskScore += 40; // High risk for placeholders
                $flags[] = 'PLACEHOLDER_CONTENT';
                break;
            }
        }

        // Rule 3: Repetitive character patterns (boredom detection)
        if (preg_match('/(.)\1{4,}/', $text)) {
            $riskScore += 30;
            $flags[] = 'REPETITIVE_STRINGS';
        }

        $result = [
            'risk_score' => min(100, $riskScore),
            'flags' => $flags,
            'level' => $this->getRiskLevel($riskScore),
            'audit_date' => now()->toISOString(),
        ];

        // AUTO-FLAGGING: If risk score is high, we can update the status
        // if ($result['risk_score'] >= 80) {
        //     $report->update(['status' => 'FLAGGED']);
        // }

        return $result;
    }

    /**
     * Detect duplicated content within a group using Optimized Hashing + Similarity
     */
    public function detectDuplicates(int $kelompokId): Collection
    {
        $reports = Laporan::where('kelompok_id', $kelompokId)
            ->whereNotNull('description')
            ->select('id', 'user_id', 'description', 'submitted_at')
            ->orderBy('submitted_at', 'desc')
            ->get();

        if ($reports->count() < 2) {
            return collect();
        }

        $duplicates = collect();
        $fingerprints = [];

        // Phase 1: Fingerprinting (O(N))
        foreach ($reports as $report) {
            // Clean text for normalization: lowercase, remove punctuation and spaces
            $cleanText = preg_replace('/[^a-z0-9]/', '', strtolower($report->description));
            
            // If text is too short to be unique, skip
            if (strlen($cleanText) < 10) continue;

            $hash = md5($cleanText);
            
            if (isset($fingerprints[$hash])) {
                // Exact match found!
                $match = $fingerprints[$hash];
                if ($match->user_id !== $report->user_id) {
                    $duplicates->push([
                        'report_a_id' => $match->id,
                        'report_b_id' => $report->id,
                        'similarity' => 100.0,
                        'type' => 'EXACT_MATCH'
                    ]);
                }
            }
            
            $fingerprints[$hash] = $report;
        }

        // Phase 2: Structural Similarity (O(N log N) or windowed comparison)
        // Only compare reports submitted on the same date or near each other
        $groupedByDate = $reports->groupBy(fn($r) => $r->submitted_at?->toDateString());

        foreach ($groupedByDate as $date => $dateReports) {
            if ($dateReports->count() < 2) continue;

            foreach ($dateReports as $i => $reportA) {
                foreach ($dateReports as $j => $reportB) {
                    if ($i >= $j) continue;
                    if ($reportA->user_id === $reportB->user_id) continue;

                    // Length proximity filter: if lengths differ by > 30%, they aren't duplicates
                    $lenA = strlen($reportA->description);
                    $lenB = strlen($reportB->description);
                    if (abs($lenA - $lenB) > min($lenA, $lenB) * 0.3) continue;

                    $similarity = 0;
                    similar_text($reportA->description, $reportB->description, $similarity);

                    if ($similarity > 85) {
                        // Avoid adding if already added via exact match
                        $exists = $duplicates->contains(fn($d) => 
                            ($d['report_a_id'] == $reportA->id && $d['report_b_id'] == $reportB->id) ||
                            ($d['report_a_id'] == $reportB->id && $d['report_b_id'] == $reportA->id)
                        );

                        if (!$exists) {
                            $duplicates->push([
                                'report_a_id' => $reportA->id,
                                'report_b_id' => $reportB->id,
                                'similarity' => round($similarity, 2),
                                'type' => 'NEAR_DUPLICATE'
                            ]);
                        }
                    }
                }
            }
        }

        return $duplicates;
    }

    protected function getRiskLevel(int $score): string
    {
        if ($score >= 80) return 'CRITICAL';
        if ($score >= 60) return 'HIGH';
        if ($score >= 30) return 'MEDIUM';
        return 'LOW';
    }
}
