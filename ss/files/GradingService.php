<?php
// app/Services/GradingService.php

namespace App\Services;

use App\Models\Score;
use App\Models\User;
use App\Models\Group;
use Illuminate\Support\Facades\DB;

class GradingService
{
    /**
     * Grade configuration with weightages
     */
    private const GRADE_WEIGHTS = [
        'execution' => 0.40,    // 40%
        'article' => 0.30,      // 30%
        'discipline' => 0.15,   // 15%
        'attitude' => 0.15,     // 15%
    ];

    /**
     * Letter grade mapping
     */
    private const GRADE_SCALE = [
        ['min' => 90, 'max' => 100, 'letter' => 'A'],
        ['min' => 85, 'max' => 89.99, 'letter' => 'A-'],
        ['min' => 80, 'max' => 84.99, 'letter' => 'B+'],
        ['min' => 75, 'max' => 79.99, 'letter' => 'B'],
        ['min' => 70, 'max' => 74.99, 'letter' => 'B-'],
        ['min' => 65, 'max' => 69.99, 'letter' => 'C+'],
        ['min' => 60, 'max' => 64.99, 'letter' => 'C'],
        ['min' => 55, 'max' => 59.99, 'letter' => 'C-'],
        ['min' => 50, 'max' => 54.99, 'letter' => 'D'],
        ['min' => 0, 'max' => 49.99, 'letter' => 'E'],
    ];

    /**
     * Submit DPL scores for a student
     */
    public function submitDPLScores(
        int $userId,
        int $groupId,
        float $executionScore,
        float $articleScore,
        int $dplId
    ): Score {
        return DB::transaction(function () use ($userId, $groupId, $executionScore, $articleScore, $dplId) {
            $score = Score::updateOrCreate(
                [
                    'user_id' => $userId,
                    'group_id' => $groupId,
                ],
                [
                    'execution_score' => $executionScore,
                    'article_score' => $articleScore,
                    'dpl_graded_by' => $dplId,
                    'dpl_graded_at' => now(),
                ]
            );

            // Recalculate if all scores are present
            if ($this->canCalculateFinalGrade($score)) {
                $this->calculateFinalGrade($score);
            }

            return $score->fresh();
        });
    }

    /**
     * Submit Village Head scores for a student
     */
    public function submitVillageHeadScores(
        int $userId,
        int $groupId,
        float $disciplineScore,
        float $attitudeScore,
        int $villageHeadId
    ): Score {
        return DB::transaction(function () use ($userId, $groupId, $disciplineScore, $attitudeScore, $villageHeadId) {
            $score = Score::updateOrCreate(
                [
                    'user_id' => $userId,
                    'group_id' => $groupId,
                ],
                [
                    'discipline_score' => $disciplineScore,
                    'attitude_score' => $attitudeScore,
                    'village_graded_by' => $villageHeadId,
                    'village_graded_at' => now(),
                ]
            );

            // Recalculate if all scores are present
            if ($this->canCalculateFinalGrade($score)) {
                $this->calculateFinalGrade($score);
            }

            return $score->fresh();
        });
    }

    /**
     * Check if all required scores are present
     */
    private function canCalculateFinalGrade(Score $score): bool
    {
        return !is_null($score->execution_score) &&
               !is_null($score->article_score) &&
               !is_null($score->discipline_score) &&
               !is_null($score->attitude_score);
    }

    /**
     * Calculate weighted scores and final grade
     */
    private function calculateFinalGrade(Score $score): void
    {
        // Calculate DPL weighted score (70% total)
        $dplWeighted = (
            ($score->execution_score * self::GRADE_WEIGHTS['execution']) +
            ($score->article_score * self::GRADE_WEIGHTS['article'])
        );

        // Calculate Village weighted score (30% total)
        $villageWeighted = (
            ($score->discipline_score * self::GRADE_WEIGHTS['discipline']) +
            ($score->attitude_score * self::GRADE_WEIGHTS['attitude'])
        );

        // Calculate total score
        $totalScore = $dplWeighted + $villageWeighted;

        // Determine letter grade
        $letterGrade = $this->determineLetterGrade($totalScore);

        // Update score record
        $score->update([
            'dpl_weighted_score' => round($dplWeighted, 2),
            'village_weighted_score' => round($villageWeighted, 2),
            'total_score' => round($totalScore, 2),
            'letter_grade' => $letterGrade,
        ]);
    }

    /**
     * Determine letter grade based on total score
     */
    private function determineLetterGrade(float $totalScore): string
    {
        foreach (self::GRADE_SCALE as $scale) {
            if ($totalScore >= $scale['min'] && $totalScore <= $scale['max']) {
                return $scale['letter'];
            }
        }

        return 'E'; // Default to lowest grade
    }

    /**
     * Get grading summary for a group
     */
    public function getGroupGradingSummary(int $groupId): array
    {
        $scores = Score::where('group_id', $groupId)
            ->with(['user:id,name,nim', 'dplGradedBy:id,name', 'villageGradedBy:id,name'])
            ->get();

        $summary = [
            'total_students' => $scores->count(),
            'fully_graded' => $scores->whereNotNull('total_score')->count(),
            'pending_dpl' => $scores->where(function ($score) {
                return is_null($score->execution_score) || is_null($score->article_score);
            })->count(),
            'pending_village' => $scores->where(function ($score) {
                return is_null($score->discipline_score) || is_null($score->attitude_score);
            })->count(),
            'grade_distribution' => $this->getGradeDistribution($scores),
            'average_score' => $scores->whereNotNull('total_score')->avg('total_score'),
            'students' => $scores->map(function ($score) {
                return [
                    'id' => $score->id,
                    'user' => $score->user,
                    'execution_score' => $score->execution_score,
                    'article_score' => $score->article_score,
                    'discipline_score' => $score->discipline_score,
                    'attitude_score' => $score->attitude_score,
                    'total_score' => $score->total_score,
                    'letter_grade' => $score->letter_grade,
                    'dpl_graded' => !is_null($score->dpl_graded_at),
                    'village_graded' => !is_null($score->village_graded_at),
                    'grading_status' => $this->getGradingStatus($score),
                ];
            }),
        ];

        return $summary;
    }

    /**
     * Get grade distribution
     */
    private function getGradeDistribution($scores): array
    {
        $distribution = [];
        foreach (self::GRADE_SCALE as $scale) {
            $letter = $scale['letter'];
            $distribution[$letter] = $scores->where('letter_grade', $letter)->count();
        }
        return $distribution;
    }

    /**
     * Get grading status for a score
     */
    private function getGradingStatus(Score $score): string
    {
        if (!is_null($score->total_score)) {
            return 'completed';
        }

        $dplComplete = !is_null($score->execution_score) && !is_null($score->article_score);
        $villageComplete = !is_null($score->discipline_score) && !is_null($score->attitude_score);

        if ($dplComplete && !$villageComplete) {
            return 'pending_village';
        }

        if (!$dplComplete && $villageComplete) {
            return 'pending_dpl';
        }

        if (!$dplComplete && !$villageComplete) {
            return 'pending_both';
        }

        return 'unknown';
    }

    /**
     * Bulk grade students (for DPL to grade multiple students at once)
     */
    public function bulkSubmitDPLScores(array $studentScores, int $dplId): array
    {
        return DB::transaction(function () use ($studentScores, $dplId) {
            $results = [];

            foreach ($studentScores as $scoreData) {
                $results[] = $this->submitDPLScores(
                    $scoreData['user_id'],
                    $scoreData['group_id'],
                    $scoreData['execution_score'],
                    $scoreData['article_score'],
                    $dplId
                );
            }

            return $results;
        });
    }

    /**
     * Export grades to CSV/Excel format
     */
    public function exportGrades(int $groupId): array
    {
        $scores = Score::where('group_id', $groupId)
            ->with(['user:id,name,nim', 'group:id,name,village'])
            ->get();

        return $scores->map(function ($score) {
            return [
                'NIM' => $score->user->nim,
                'Nama' => $score->user->name,
                'Kelompok' => $score->group->name,
                'Desa' => $score->group->village,
                'Pelaksanaan (40%)' => $score->execution_score,
                'Artikel (30%)' => $score->article_score,
                'Kedisiplinan (15%)' => $score->discipline_score,
                'Sikap (15%)' => $score->attitude_score,
                'Total DPL' => $score->dpl_weighted_score,
                'Total Desa' => $score->village_weighted_score,
                'Nilai Total' => $score->total_score,
                'Nilai Huruf' => $score->letter_grade,
            ];
        })->toArray();
    }
}
