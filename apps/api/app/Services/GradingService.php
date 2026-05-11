<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\KknType;
use App\Jobs\FinalizeMassScoresJob;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KonfigurasiPenilaian;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\MonitoringDpl;
use App\Models\KKN\NilaiKkn;
use App\Services\KKN\GradeConversionService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GradingService
{
    /**
     * Submit DPL scores for a student (Refined for KKN 56)
     */
    public function submitDPLScores(
        int $userId,
        int $groupId,
        array $scores, // Array containing relevansi, ketercapaian, inovasi, administrasi, artikel
        int $dplId
    ): NilaiKkn {
        // MANDATORY MONITORING GUARD:
        // LPPM requirement: Min 2 field visits recorded before grading allowed.
        $monitoringCount = MonitoringDpl::where('kelompok_id', $groupId)
            ->where('dpl_id', $dplId)
            ->count();
        if ($monitoringCount < 2) {
            throw new \DomainException("Penilaian ditolak. DPL wajib melakukan minimal 2 kali kunjungan monitoring (saat ini: {$monitoringCount}) sebelum memberikan nilai.");
        }

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
        $kknType = self::resolveKknType($period);

        // Load configs from DB (cached) with fallback
        $cacheKey = 'grading_configs_'.$kknType->value;
        try {
            $configs = Cache::remember($cacheKey, 3600, function () use ($kknType) {
                return KonfigurasiPenilaian::getForType($kknType)->pluck('percentage', 'config_key');
            });
        } catch (\Throwable $e) {
            Log::error('GradingService: failed to load KonfigurasiPenilaian, aborting grade calculation', [
                'kkn_type' => $kknType->value,
                'score_id' => $score->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }

        // 1. Calculate Component A (DPL)
        // DPL has 3 indicators: Laporan (dpl_administrasi_score), Pelaksanaan (dpl_ketercapaian_score), Artikel (dpl_artikel_score)
        $dplReportWeight = floatval($configs['weight_dpl_report'] ?? 30) / 100;
        $dplExecutionWeight = floatval($configs['weight_dpl_execution'] ?? 40) / 100;
        $dplArticleWeight = floatval($configs['weight_dpl_article'] ?? 30) / 100;

        $reportPart = floatval($score->dpl_administrasi_score ?? 0);
        $executionPart = floatval($score->dpl_ketercapaian_score ?? 0); // No longer averaged with relevansi & inovasi
        $articlePart = floatval($score->dpl_artikel_score ?? 0);

        $aRaw = ($reportPart * $dplReportWeight) + ($executionPart * $dplExecutionWeight) + ($articlePart * $dplArticleWeight);

        // 2. Calculate Component B (Village/Mitra)
        // Desa has 2 indicators: Sikap (desa_interaksi_score), Kedisiplinan (desa_disiplin_score)
        $villageAttitudeWeight = floatval($configs['weight_village_attitude'] ?? 50) / 100;
        $villageDisciplineWeight = floatval($configs['weight_village_discipline'] ?? 50) / 100;

        $attitudePart = floatval($score->desa_interaksi_score ?? 0);
        $disciplinePart = floatval($score->desa_disiplin_score ?? 0); // No longer averaged with kinerja

        $bRaw = ($attitudePart * $villageAttitudeWeight) + ($disciplinePart * $villageDisciplineWeight);

        // 3. Calculate Component C (LPPM)
        // LPPM component is 100% based on Administration Score (administration_score)
        $cRaw = floatval($score->administration_score ?? 0);

        // 4. Apply Main Weights
        $dplWeight = floatval($configs['weight_main_dpl'] ?? 40) / 100;
        $villageWeight = floatval($configs['weight_main_village'] ?? 20) / 100;
        $lppmWeight = floatval($configs['weight_main_lppm'] ?? 40) / 100;

        $totalScore = ($aRaw * $dplWeight) + ($bRaw * $villageWeight) + ($cRaw * $lppmWeight);

        // Determine letter grade from centralized service
        $gradeData = GradeConversionService::convert($totalScore);

        // Update score record
        NilaiKkn::where('id', $score->id)->update([
            'dpl_weighted_score' => round($aRaw, 2),
            'village_weighted_score' => round($bRaw, 2),
            'lppm_weighted_score' => round($cRaw, 2),
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
        return GradeConversionService::convert($totalScore)['grade'];
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

            AuditService::log(
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
        $total = NilaiKkn::whereHas('kelompok', fn ($q) => $q->where('periode_id', $periodId))
            ->where('is_finalized', false)
            ->whereNotNull('total_score')
            ->count();

        Cache::put("finalize_progress_{$periodId}", [
            'total' => $total,
            'processed' => 0,
            'status' => 'processing',
            'started_at' => now(),
        ], 3600);

        FinalizeMassScoresJob::dispatch($periodId, auth()->id());
    }

    /**
     * Get AI-driven performance summary for a student
     */
    public function getAiPerformanceSummary(int $studentId): array
    {
        return Cache::remember("ai_performance_v3_{$studentId}", 3600, function () use ($studentId) {
            $activities = KegiatanKkn::where('mahasiswa_id', $studentId)
                ->workflowApproved()
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

            $avgCompliance = $activities->avg(fn ($a) => ($a->ai_analysis['abcd_compliance'] ?? 0));
            $avgQuality = $activities->avg(fn ($a) => ($a->ai_analysis['quality_score'] ?? 0));

            $tags = $activities->flatMap(fn ($a) => $a->ai_analysis['tags'] ?? [])
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

    private static function resolveKknType(?object $period): KknType
    {
        if (! $period) {
            return KknType::REGULER;
        }

        $jenisKkn = $period->jenisKkn ?? null;
        if ($jenisKkn) {
            $code = match ($jenisKkn->code ?? 'REGULER') {
                'NUSANTARA' => KknType::NUSANTARA,
                'INTERNASIONAL' => KknType::INTERNASIONAL,
                'KOLABORASI_PTKIN' => KknType::KOLABORASI_PTKIN,
                'KAMPUNG_ZAKAT' => KknType::KAMPUNG_ZAKAT,
                'DESA_KATANA' => KknType::DESA_KATANA,
                'TEMATIK' => KknType::TEMATIK,
                default => KknType::REGULER,
            };

            return $code;
        }

        $jenisAttr = $period->jenis ?? $period->program_type ?? null;
        if ($jenisAttr instanceof KknType) {
            return $jenisAttr;
        }

        return KknType::tryFrom($jenisAttr ?? 'REGULER') ?? KknType::REGULER;
    }
}
