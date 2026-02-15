<?php

namespace App\Services;

use App\Models\KKN\NilaiKkn;
use App\Models\User;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\KonfigurasiPenilaian;
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
    ): NilaiKkn {
        return DB::transaction(function () use ($userId, $groupId, $reportScore, $executionScore, $articleScore, $dplId) {
            $score = NilaiKkn::updateOrCreate(
                [
                    'mahasiswa_id' => $userId,
                    'kelompok_id' => $groupId,
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
    ): NilaiKkn {
        return DB::transaction(function () use ($userId, $groupId, $disciplineScore, $attitudeScore, $villageHeadId) {
            $score = NilaiKkn::updateOrCreate(
                [
                    'mahasiswa_id' => $userId,
                    'kelompok_id' => $groupId,
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
    ): NilaiKkn {
        return DB::transaction(function () use ($userId, $groupId, $workshopScore, $adminScore, $adminId) {
            $score = NilaiKkn::updateOrCreate(
                [
                    'mahasiswa_id' => $userId,
                    'kelompok_id' => $groupId,
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
    public function calculateFinalGrade(NilaiKkn $score): void
    {
        $configs = Cache::remember('grading_configs', 3600, function () {
            return KonfigurasiPenilaian::all()->pluck('percentage', 'config_key');
        });

        // 1. Calculate Komponen A (DPL)
        $aWeighted = (
            (floatval($score->final_report_score ?? 0) * (floatval($configs['weight_dpl_report'] ?? 30) / 100)) +
            (floatval($score->execution_score ?? 0) * (floatval($configs['weight_dpl_execution'] ?? 40) / 100)) +
            (floatval($score->article_score ?? 0) * (floatval($configs['weight_dpl_article'] ?? 30) / 100))
        );

        // 2. Calculate Komponen B (Mitra)
        $bWeighted = (
            (floatval($score->attitude_score ?? 0) * (floatval($configs['weight_village_attitude'] ?? 50) / 100)) +
            (floatval($score->discipline_score ?? 0) * (floatval($configs['weight_village_discipline'] ?? 50) / 100))
        );

        // 3. Calculate Komponen C (LPPM)
        $cWeighted = (
            (floatval($score->workshop_score ?? 0) * (floatval($configs['weight_admin_workshop'] ?? 50) / 100)) +
            (floatval($score->administration_score ?? 0) * (floatval($configs['weight_admin_administration'] ?? 50) / 100))
        );

        // Final Score with Main Group Weights
        $totalScore = (
            ($aWeighted * (floatval($configs['weight_main_dpl'] ?? 50) / 100)) +
            ($bWeighted * (floatval($configs['weight_main_village'] ?? 30) / 100)) +
            ($cWeighted * (floatval($configs['weight_main_lppm'] ?? 20) / 100))
        );

        // Determine letter grade
        $letterGrade = $this->determineLetterGrade($totalScore);

        // Update score record
        $score->update([
            'dpl_weighted_score' => round($aWeighted, 2),
            'village_weighted_score' => round($bWeighted, 2),
            'lppm_weighted_score' => round($cWeighted, 2),
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
        $scores = NilaiKkn::where('kelompok_id', $groupId)
            ->with(['mahasiswa:id,nama', 'kelompok'])
            ->get();

        return [
            'total_students' => $scores->count(),
            'fully_graded' => $scores->whereNotNull('total_score')->count(),
            'average_score' => $scores->whereNotNull('total_score')->avg('total_score'),
            'students' => $scores->map(function ($score) {
                return [
                    'id' => $score->id,
                    'user' => $score->mahasiswa,
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
        $count = 0;
        $failed = 0;

        NilaiKkn::whereHas('kelompok', function ($query) use ($periodId) {
            $query->where('periode_id', $periodId);
        })
        ->with(['mahasiswa.user']) // Eager load student user for notifications
        ->where('is_finalized', false)
        ->whereNotNull('total_score')
        ->chunkById(50, function ($scores) use (&$count, &$failed) {
            // Bulk check Laporan Akhir to avoid N+1 queries
            $studentIds = $scores->pluck('mahasiswa_id');
            $groupIds = $scores->pluck('kelompok_id')->unique();
            
            $reports = \App\Models\KKN\LaporanAkhir::whereIn('mahasiswa_id', $studentIds)
                ->whereIn('kelompok_id', $groupIds)
                ->get()
                ->groupBy(fn($r) => $r->mahasiswa_id . '|' . $r->kelompok_id);

            foreach ($scores as $score) {
                $lookupKey = $score->mahasiswa_id . '|' . $score->kelompok_id;
                $report = $reports->get($lookupKey)?->first();

                if (!$report || $report->status !== 'approved') {
                    $failed++;
                    continue;
                }

                // CHECK: Anti-Delusion Logic
                // Ensure all components have values if weighting is > 0
                // This is optional but recommended
                
                $score->update(['is_finalized' => true]);
                $count++;

                // Notify student
                if ($score->mahasiswa?->user) {
                    $score->mahasiswa->user->notify(new \App\Notifications\KknActivityNotification([
                        'type' => 'success',
                        'title' => 'Nilai KKN Difinalisasi',
                        'message' => 'Nilai KKN Anda telah difinalisasi oleh Admin LPPM. Silakan unduh sertifikat.',
                        'icon' => 'academic-cap',
                        'url' => route('student.dashboard'),
                    ]));
                }
            }
        });

        \App\Services\AuditService::log(
            'MASS_FINALIZE',
            "Melakukan finalisasi massal untuk Periode ID: {$periodId}. Berhasil: {$count}, Gagal (Anti-Halu): {$failed}",
            null,
            ['period_id' => $periodId],
            ['finalized_count' => $count, 'failed_count' => $failed]
        );

        return $count;
    }

    public function updateUnifiedScore(int $userId, int $groupId, array $components, int $adminId): NilaiKkn
    {
        return DB::transaction(function () use ($userId, $groupId, $components, $adminId) {
            $score = NilaiKkn::updateOrCreate(
                ['mahasiswa_id' => $userId, 'kelompok_id' => $groupId],
                array_merge($components, [
                    'updated_at' => now(),
                ])
            );

            $this->calculateFinalGrade($score);
            
            \App\Services\AuditService::log(
                'UPDATE_SCORE_ADMIN',
                "Admin mengupdate komponen nilai secara manual: " . json_encode($components),
                $score,
                null, // will be handled by observer if registered, but service logging is more specific
                $components
            );

            return $score->fresh();
        });
    }

    /**
     * Dispatch background job for mass finalization
     */
    public function dispatchMassFinalization(int $periodId): void
    {
        $total = NilaiKkn::whereHas('kelompok', fn($q) => $q->where('period_id', $periodId))
            ->where('is_finalized', false)
            ->whereNotNull('total_score')
            ->count();

        Cache::put("finalize_progress_{$periodId}", [
            'total' => $total,
            'processed' => 0,
            'status' => 'processing',
            'started_at' => now(),
        ], 3600);

        \App\Jobs\FinalizeMassScoresJob::dispatch($periodId, auth()->id());
    }
}