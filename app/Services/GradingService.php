<?php

namespace App\Services;

use App\Models\KknScore;
use App\Models\User;
use App\Models\Group;
use App\Models\GradingConfig;
use App\Notifications\KknActivityNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;

class GradingService
{
    /**
     * Letter grade mapping
     */
    private const GRADE_SCALE = [
        ['min' => 85, 'max' => 100, 'letter' => 'A'],
        ['min' => 80, 'max' => 84.99, 'letter' => 'A-'],
        ['min' => 75, 'max' => 79.99, 'letter' => 'B+'],
        ['min' => 70, 'max' => 74.99, 'letter' => 'B'],
        ['min' => 65, 'max' => 69.99, 'letter' => 'B-'],
        ['min' => 60, 'max' => 64.99, 'letter' => 'C+'],
        ['min' => 55, 'max' => 59.99, 'letter' => 'C'],
        ['min' => 0, 'max' => 54.99, 'letter' => 'D'],
    ];

    /**
     * Submit DPL scores for a student
     */
    public function submitDPLScores(
        int $userId,
        int $groupId,
        float $reportScore,
        float $executionScore,
        float $articleScore,
        int $dplId
    ): KknScore {
        return DB::transaction(function () use ($userId, $groupId, $reportScore, $executionScore, $articleScore, $dplId) {
            $score = KknScore::updateOrCreate(
                [
                    'student_id' => $userId,
                    'group_id' => $groupId,
                ],
                [
                    'final_report_score' => $reportScore,
                    'execution_score' => $executionScore,
                    'article_score' => $articleScore,
                    'dpl_graded_by' => $dplId,
                    'dpl_graded_at' => now(),
                ]
            );

            $this->calculateFinalGrade($score);

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
    ): KknScore {
        return DB::transaction(function () use ($userId, $groupId, $disciplineScore, $attitudeScore, $villageHeadId) {
            $score = KknScore::updateOrCreate(
                [
                    'student_id' => $userId,
                    'group_id' => $groupId,
                ],
                [
                    'discipline_score' => $disciplineScore,
                    'attitude_score' => $attitudeScore,
                    'village_graded_by' => $villageHeadId,
                    'village_graded_at' => now(),
                ]
            );

            $this->calculateFinalGrade($score);

            return $score->fresh();
        });
    }

    /**
     * Submit Admin scores for a student
     */
    public function submitAdminScores(
        int $userId,
        int $groupId,
        float $workshopScore,
        float $adminScore,
        int $adminId
    ): KknScore {
        return DB::transaction(function () use ($userId, $groupId, $workshopScore, $adminScore, $adminId) {
            $score = KknScore::updateOrCreate(
                [
                    'student_id' => $userId,
                    'group_id' => $groupId,
                ],
                [
                    'workshop_score' => $workshopScore,
                    'administration_score' => $adminScore,
                    'admin_graded_by' => $adminId,
                    'admin_graded_at' => now(),
                ]
            );

            $this->calculateFinalGrade($score);

            return $score->fresh();
        });
    }

    /**
     * Calculate weighted scores and final grade
     */
    public function calculateFinalGrade(KknScore $score): void
    {
        $configs = Cache::remember('grading_configs', 3600, function () {
            return GradingConfig::all()->pluck('percentage', 'config_key');
        });

        // 1. Calculate Komponen A (DPL)
        $aWeighted = (
            (floatval($score->final_report_score) * (floatval($configs->get('weight_dpl_report', 30)) / 100)) +
            (floatval($score->execution_score) * (floatval($configs->get('weight_dpl_execution', 40)) / 100)) +
            (floatval($score->article_score) * (floatval($configs->get('weight_dpl_article', 30)) / 100))
        );

        // 2. Calculate Komponen B (Mitra)
        $bWeighted = (
            (floatval($score->attitude_score) * (floatval($configs->get('weight_village_attitude', 50)) / 100)) +
            (floatval($score->discipline_score) * (floatval($configs->get('weight_village_discipline', 50)) / 100))
        );

        // 3. Calculate Komponen C (LPPM)
        $cWeighted = (
            (floatval($score->workshop_score) * (floatval($configs->get('weight_admin_workshop', 50)) / 100)) +
            (floatval($score->administration_score) * (floatval($configs->get('weight_admin_administration', 50)) / 100))
        );

        // Final Score with Main Group Weights
        $totalScore = (
            ($aWeighted * (floatval($configs->get('weight_main_dpl', 50)) / 100)) +
            ($bWeighted * (floatval($configs->get('weight_main_village', 30)) / 100)) +
            ($cWeighted * (floatval($configs->get('weight_main_lppm', 20)) / 100))
        );

        // Determine letter grade
        $letterGrade = $this->determineLetterGrade($totalScore);

        // Update score record
        $score->update([
            'dpl_weighted_score' => round($aWeighted, 2),
            'village_weighted_score' => round($bWeighted, 2),
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

        return 'D';
    }

    /**
     * Get grading summary
     */
    public function getGroupGradingSummary(int $groupId): array
    {
        $scores = KknScore::where('group_id', $groupId)
            ->with(['student:id,name', 'dplGradedBy:id,name', 'villageGradedBy:id,name', 'adminGradedBy:id,name'])
            ->get();

        return [
            'total_students' => $scores->count(),
            'fully_graded' => $scores->whereNotNull('total_score')->count(),
            'average_score' => $scores->whereNotNull('total_score')->avg('total_score'),
            'students' => $scores->map(function ($score) {
                return [
                    'id' => $score->id,
                    'user' => $score->student,
                    'final_report_score' => $score->final_report_score,
                    'execution_score' => $score->execution_score,
                    'article_score' => $score->article_score,
                    'discipline_score' => $score->discipline_score,
                    'attitude_score' => $score->attitude_score,
                    'workshop_score' => $score->workshop_score,
                    'administration_score' => $score->administration_score,
                    'total_score' => $score->total_score,
                ];
            }),
        ];
    }

    /**
     * Finalize all scores for a specific period (Synchronous)
     */
    public function finalizeAll(int $periodId): int
    {
        $scoresToFinalize = KknScore::whereHas('group', function ($query) use ($periodId) {
            $query->where('period_id', $periodId);
        })
        ->where('is_finalized', false)
        ->whereNotNull('total_score')
        ->get();

        $count = 0;
        $failed = 0;
        
        foreach ($scoresToFinalize as $score) {
            // Anti-Halu Logic: Cek Laporan Akhir
            $report = \App\Models\FinalReport::where('student_id', $score->student_id)
                ->where('group_id', $score->group_id)
                ->first();

            if (!$report || $report->status !== 'approved') {
                $failed++;
                continue;
            }

            $score->update(['is_finalized' => true]);
            $count++;

            // Notify student
            $studentUser = \App\Models\User::find($score->student_id);
            if ($studentUser) {
                $studentUser->notify(new \App\Notifications\KknActivityNotification([
                    'type' => 'success',
                    'title' => 'Nilai KKN Difinalisasi',
                    'message' => 'Nilai KKN Anda telah difinalisasi oleh Admin LPPM. Silakan unduh sertifikat.',
                    'icon' => 'academic-cap',
                    'url' => route('student.dashboard'),
                ]));
            }
        }

        \App\Services\AuditService::log(
            'MASS_FINALIZE',
            "Melakukan finalisasi massal untuk Periode ID: {$periodId}. Berhasil: {$count}, Gagal (Anti-Halu): {$failed}",
            null,
            ['period_id' => $periodId],
            ['finalized_count' => $count, 'failed_count' => $failed]
        );

        return $count;
    }

    /**
     * Dispatch background job for mass finalization
     */
    public function dispatchMassFinalization(int $periodId): void
    {
        \App\Jobs\FinalizeMassScoresJob::dispatch($periodId, auth()->id());
    }
}
