<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\KonfigurasiPenilaian;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\NilaiKkn;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class GradingService
{
    // Grade conversion is handled by GradeConversionService::convert()
    // See: app/Services/KKN/GradeConversionService.php

    /**
     * Submit DPL scores for a student (Refined for KKN 56)
     */
    public function submitDPLScores(
        int $userId,
        int $groupId,
        array $scores, // Array containing relevansi, ketercapaian, inovasi, administrasi, artikel
        int $dplId
    ): NilaiKkn {
        return DB::transaction(function () use ($userId, $groupId, $scores, $dplId) {
            $score = NilaiKkn::updateOrCreate(
                ['user_id' => $userId, 'kelompok_id' => $groupId],
                [
                    'dpl_relevansi_score' => $scores['relevansi'] ?? 0,
                    'dpl_ketercapaian_score' => $scores['ketercapaian'] ?? 0,
                    'dpl_inovasi_score' => $scores['inovasi'] ?? 0,
                    'dpl_administrasi_score' => $scores['administrasi'] ?? 0,
                    'dpl_artikel_score' => $scores['artikel'] ?? 0,
                    'dpl_graded_by' => $dplId,
                    'dpl_graded_at' => now(),
                ]
            );

            $this->calculateFinalGrade($score);

            return $score->fresh();
        });
    }

    /**
     * Submit Village Head scores for a student (Refined for KKN 56)
     */
    public function submitVillageHeadScores(
        int $userId,
        int $groupId,
        array $scores, // Array containing interaksi, disiplin, kinerja
        int $villageHeadId
    ): NilaiKkn {
        return DB::transaction(function () use ($userId, $groupId, $scores, $villageHeadId) {
            $score = NilaiKkn::updateOrCreate(
                ['user_id' => $userId, 'kelompok_id' => $groupId],
                [
                    'desa_interaksi_score' => $scores['interaksi'] ?? 0,
                    'desa_disiplin_score' => $scores['disiplin'] ?? 0,
                    'desa_kinerja_score' => $scores['kinerja'] ?? 0,
                    'village_graded_by' => $villageHeadId,
                    'village_graded_at' => now(),
                ]
            );

            $this->calculateFinalGrade($score);

            return $score->fresh();
        });
    }

    /**
     * Calculate weighted scores and final grade (Dynamic KKN Logic)
     */
    public function calculateFinalGrade(NilaiKkn $score): void
    {
        $score->loadMissing('kelompok.periode');
        $period = $score->kelompok?->periode;

        // Resolve KKN Type for config lookup
        $kknType = $period?->jenis instanceof \App\Enums\KknType
            ? $period->jenis
            : \App\Enums\KknType::tryFrom($period?->jenis) ?? \App\Enums\KknType::REGULER;

        // Load configs from DB (cached)
        $cacheKey = 'grading_configs_'.$kknType->value;
        $configs = Cache::remember($cacheKey, 3600, function () use ($kknType) {
            return KonfigurasiPenilaian::getForType($kknType)->pluck('percentage', 'config_key');
        });

        // 1. Calculate Component A (DPL)
        $aRaw = (
            (floatval($score->dpl_relevansi_score ?? 0) * (floatval($configs['weight_dpl_report'] ?? 20) / 100)) +
            (floatval($score->dpl_ketercapaian_score ?? 0) * (floatval($configs['weight_dpl_execution'] ?? 20) / 100)) +
            (floatval($score->dpl_inovasi_score ?? 0) * (floatval($configs['weight_dpl_article'] ?? 20) / 100)) +
            (floatval($score->dpl_administrasi_score ?? 0) * (floatval($configs['weight_dpl_report'] ?? 20) / 100)) +
            (floatval($score->dpl_artikel_score ?? 0) * (floatval($configs['weight_dpl_article'] ?? 20) / 100))
        );

        // 2. Calculate Component B (Village/Mitra)
        $bRaw = (
            (floatval($score->desa_interaksi_score ?? 0) * (floatval($configs['weight_village_attitude'] ?? 50) / 100)) +
            (floatval($score->desa_disiplin_score ?? 0) * (floatval($configs['weight_village_discipline'] ?? 50) / 100))
        );

        // 3. Calculate Component C (LPPM)
        // SURGICAL CLEANUP: LPPM component is now 100% based on Administration Score
        $cRaw = floatval($score->administration_score ?? 0);

        // 4. Apply Main Weights
        $aWeighted = $aRaw * (floatval($configs['weight_main_dpl'] ?? 40) / 100);
        $bWeighted = $bRaw * (floatval($configs['weight_main_village'] ?? 20) / 100);
        $cWeighted = $cRaw * (floatval($configs['weight_main_lppm'] ?? 40) / 100);

        $totalScore = $aWeighted + $bWeighted + $cWeighted;

        // Determine letter grade from centralized service
        $gradeData = \App\Services\KKN\GradeConversionService::convert($totalScore);

        // Update score record
        NilaiKkn::where('id', $score->id)->update([
            'dpl_weighted_score' => round($aWeighted, 2),
            'village_weighted_score' => round($bWeighted, 2),
            'lppm_weighted_score' => round($cWeighted, 2),
            'total_score' => round($totalScore, 2),
            'letter_grade' => $gradeData['grade'],
            // Sync legacy fields
            'final_report_score' => $score->dpl_administrasi_score,
            'execution_score' => $score->dpl_ketercapaian_score,
            'article_score' => $score->dpl_artikel_score,
            'discipline_score' => $score->desa_disiplin_score,
            'attitude_score' => $score->desa_interaksi_score,
        ]);
    }

    /**
     * Determine letter grade based on total score.
     */
    public static function determineLetterGrade(float $totalScore): string
    {
        return \App\Services\KKN\GradeConversionService::convert($totalScore)['grade'];
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
                    'administration_score' => $score->administration_score,
                    'total_score' => $score->total_score,
                ];
            }),
        ];
    }

    /**
     * Check eligibility method - pass periodeId to exclude current period
     */
    public function checkEligibilityForPeriod(Mahasiswa $mahasiswa, int $periodeId): array
    {
        return app(EligibilityService::class)->checkEligibility($mahasiswa, $periodeId);
    }

    private const SAFE_SCORE_COMPONENTS = [
        'final_report_score', 'execution_score', 'article_score',
        'discipline_score', 'attitude_score',
        'administration_score', 'dpl_score_1',
    ];

    public function updateUnifiedScore(int $userId, int $groupId, array $components, int $adminId): NilaiKkn
    {
        // Defense-in-depth: only allow known score component fields
        $components = array_intersect_key($components, array_flip(self::SAFE_SCORE_COMPONENTS));

        return DB::transaction(function () use ($userId, $groupId, $components, $adminId) {
            $score = NilaiKkn::updateOrCreate(
                ['user_id' => $userId, 'kelompok_id' => $groupId],
                array_merge($components, [
                    'admin_graded_by' => $adminId,
                    'admin_graded_at' => now(),
                ])
            );

            $this->calculateFinalGrade($score);

            \App\Services\AuditService::log(
                'UPDATE_SCORE_ADMIN',
                'Admin mengupdate komponen nilai secara manual: '.json_encode($components),
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
        $total = NilaiKkn::whereHas('kelompok', fn ($q) => $q->where('period_id', $periodId))
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

    /**
     * Get AI-driven performance summary for a student
     */
    public function getAiPerformanceSummary(int $studentId): array
    {
        return Cache::remember("ai_performance_v3_{$studentId}", 3600, function () use ($studentId) {
            $activities = \App\Models\KKN\KegiatanKkn::where('mahasiswa_id', $studentId)
                ->where('status', 'approved')
                ->whereNotNull('ai_analysis')
                ->get();

            if ($activities->isEmpty()) {
                return [
                    'has_data' => false,
                    'avg_compliance' => 0,
                    'avg_quality' => 0,
                    'total_reports' => 0,
                    'suggested_admin_score' => 0,
                    'top_tags' => [],
                ];
            }

            $avgCompliance = $activities->avg(fn($a) => ($a->ai_analysis['abcd_compliance'] ?? 0));
            $avgQuality = $activities->avg(fn($a) => ($a->ai_analysis['quality_score'] ?? 0));
            
            $tags = $activities->flatMap(fn($a) => $a->ai_analysis['tags'] ?? [])
                ->countBy()
                ->sortDesc()
                ->take(3)
                ->keys()
                ->toArray();

            $rawScore = ($avgCompliance * 7) + ($avgQuality * 3);
            
            return [
                'has_data' => true,
                'avg_compliance' => round($avgCompliance, 1),
                'avg_quality' => round($avgQuality, 1),
                'total_reports' => $activities->count(),
                'suggested_admin_score' => round($rawScore, 1),
                'top_tags' => $tags,
            ];
        });
    }
}
