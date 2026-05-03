<?php

declare(strict_types=1);

namespace App\Services\KKN;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Detects DPL scoring outliers to ensure fairness across evaluators.
 *
 * Uses Z-score analysis: if a DPL's average score deviates more than
 * the configured threshold from the overall mean, they are flagged.
 */
class DplScoreCalibrationService
{
    /** Z-score threshold above which a DPL is considered an outlier. */
    private const Z_SCORE_THRESHOLD = 1.5;

    /**
     * Analyze DPL scoring patterns for a given periode.
     *
     * @return array{
     *   overall_mean: float,
     *   overall_stddev: float,
     *   dpl_stats: Collection,
     *   outliers: Collection,
     *   is_calibrated: bool
     * }
     */
    public function analyzeForPeriode(int $periodeId): array
    {
        // Get per-DPL average scores
        $dplStats = DB::table('evaluasi_dpl_peserta')
            ->join('peserta_kkn', 'evaluasi_dpl_peserta.peserta_kkn_id', '=', 'peserta_kkn.id')
            ->join('kelompok_kkn', 'peserta_kkn.kelompok_id', '=', 'kelompok_kkn.id')
            ->join('dosen', 'evaluasi_dpl_peserta.dosen_id', '=', 'dosen.id')
            ->where('kelompok_kkn.periode_id', $periodeId)
            ->whereNotNull('evaluasi_dpl_peserta.total_score')
            ->select([
                'evaluasi_dpl_peserta.dosen_id',
                'dosen.nama as dosen_nama',
                DB::raw('COUNT(*) as total_evaluations'),
                DB::raw('ROUND(AVG(evaluasi_dpl_peserta.total_score)::numeric, 2) as avg_score'),
                DB::raw('ROUND(STDDEV_POP(evaluasi_dpl_peserta.total_score)::numeric, 2) as stddev_score'),
                DB::raw('ROUND(MIN(evaluasi_dpl_peserta.total_score)::numeric, 2) as min_score'),
                DB::raw('ROUND(MAX(evaluasi_dpl_peserta.total_score)::numeric, 2) as max_score'),
            ])
            ->groupBy('evaluasi_dpl_peserta.dosen_id', 'dosen.nama')
            ->having(DB::raw('COUNT(*)'), '>=', 3) // Minimal 3 evaluasi untuk statistik bermakna
            ->get();

        if ($dplStats->isEmpty()) {
            return [
                'overall_mean' => 0,
                'overall_stddev' => 0,
                'dpl_stats' => collect(),
                'outliers' => collect(),
                'is_calibrated' => true,
            ];
        }

        // Calculate overall mean & stddev across all DPL averages
        $overallMean = round($dplStats->avg('avg_score'), 2);
        $variance = $dplStats->avg(fn ($s) => pow($s->avg_score - $overallMean, 2));
        $overallStddev = round(sqrt($variance), 2);

        // Tag each DPL with z-score
        $dplStats = $dplStats->map(function ($stat) use ($overallMean, $overallStddev) {
            $zScore = $overallStddev > 0
                ? round(($stat->avg_score - $overallMean) / $overallStddev, 2)
                : 0;

            $stat->z_score = $zScore;
            $stat->is_outlier = abs($zScore) > self::Z_SCORE_THRESHOLD;
            $stat->direction = $zScore > self::Z_SCORE_THRESHOLD
                ? 'terlalu_tinggi'
                : ($zScore < -self::Z_SCORE_THRESHOLD ? 'terlalu_rendah' : 'normal');

            return $stat;
        });

        $outliers = $dplStats->filter(fn ($s) => $s->is_outlier);

        return [
            'overall_mean' => $overallMean,
            'overall_stddev' => $overallStddev,
            'dpl_stats' => $dplStats,
            'outliers' => $outliers,
            'is_calibrated' => $outliers->isEmpty(),
        ];
    }

    /**
     * Get a human-readable calibration report.
     */
    public function getCalibrationReport(int $periodeId): array
    {
        $analysis = $this->analyzeForPeriode($periodeId);

        $warnings = $analysis['outliers']->map(function ($outlier) use ($analysis) {
            $direction = $outlier->direction === 'terlalu_tinggi' ? 'lebih tinggi' : 'lebih rendah';

            return [
                'dosen_id' => $outlier->dosen_id,
                'dosen_nama' => $outlier->dosen_nama,
                'avg_score' => $outlier->avg_score,
                'z_score' => $outlier->z_score,
                'message' => "{$outlier->dosen_nama} memberi rata-rata nilai {$outlier->avg_score} "
                    ."(z-score: {$outlier->z_score}), signifikan {$direction} dari rata-rata umum "
                    ."{$analysis['overall_mean']}. Perlu peninjauan.",
            ];
        })->values();

        return [
            'is_calibrated' => $analysis['is_calibrated'],
            'summary' => $analysis['is_calibrated']
                ? 'Semua DPL memberikan penilaian dalam rentang wajar.'
                : count($warnings).' DPL terdeteksi memberikan nilai di luar rentang wajar.',
            'overall_mean' => $analysis['overall_mean'],
            'overall_stddev' => $analysis['overall_stddev'],
            'total_dpl_analyzed' => $analysis['dpl_stats']->count(),
            'warnings' => $warnings,
        ];
    }
}
