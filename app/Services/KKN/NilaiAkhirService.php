<?php

namespace App\Services\KKN;

use App\Models\KKN\NilaiKkn;
use App\Models\KKN\KonfigurasiPenilaian;
use App\Services\AuditService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class NilaiAkhirService
{
    /**
     * Calculate and save the final score for a student in a specific group.
     * ALIGNED with GradingService - uses weighted sum calculation.
     */
    public function finalize(int $nilaiKknId): NilaiKkn
    {
        return DB::transaction(function () use ($nilaiKknId) {
            $nilai = NilaiKkn::with('kelompok.periode', 'mahasiswa')->findOrFail($nilaiKknId);
            $period = $nilai->kelompok?->periode;

            if (!$period) {
                throw new \Exception('Periode KKN tidak ditemukan untuk penilaian ini.');
            }

            // Guard: Laporan Akhir must be approved before finalization
            $mahasiswaId = $nilai->mahasiswa?->id;
            if ($mahasiswaId) {
                $reportApproved = \App\Models\KKN\LaporanAkhir::where('mahasiswa_id', $mahasiswaId)
                    ->where('kelompok_id', $nilai->kelompok_id)
                    ->where('status', 'approved')
                    ->exists();

                if (!$reportApproved) {
                    throw new \Exception('Laporan akhir mahasiswa belum disetujui. Nilai tidak dapat difinalisasi.');
                }
            }

            // Get KKN type and load grading configuration (aligned with GradingService)
            $kknType = $nilai->kelompok?->periode?->jenis;
            if (!$kknType instanceof \App\Enums\KknType) {
                $kknType = \App\Enums\KknType::tryFrom($kknType) ?? \App\Enums\KknType::REGULER;
            }

            $cacheKey = 'grading_configs_' . $kknType->value;
            $configs = Cache::remember($cacheKey, 3600, function () use ($kknType) {
                return KonfigurasiPenilaian::getForType($kknType)->pluck('percentage', 'config_key');
            });

            // 1. Calculate Komponen A (DPL) - Weighted sum
            $dplWeighted = (
                (floatval($nilai->final_report_score ?? 0) * (floatval($configs['weight_dpl_report'] ?? 30) / 100)) +
                (floatval($nilai->execution_score ?? 0) * (floatval($configs['weight_dpl_execution'] ?? 40) / 100)) +
                (floatval($nilai->article_score ?? 0) * (floatval($configs['weight_dpl_article'] ?? 30) / 100))
            );

            // 2. Calculate Komponen B (Village/Mitra) - Weighted sum
            $villageWeighted = (
                (floatval($nilai->attitude_score ?? 0) * (floatval($configs['weight_village_attitude'] ?? 50) / 100)) +
                (floatval($nilai->discipline_score ?? 0) * (floatval($configs['weight_village_discipline'] ?? 50) / 100))
            );

            // 3. Calculate Komponen C (LPPM) - Weighted sum
            $lppmWeighted = (
                (floatval($nilai->workshop_score ?? 0) * (floatval($configs['weight_admin_workshop'] ?? 50) / 100)) +
                (floatval($nilai->administration_score ?? 0) * (floatval($configs['weight_admin_administration'] ?? 50) / 100))
            );

            // 4. Apply main weights: DPL 40%, Village 20%, LPPM 40%
            $totalScore = (
                ($dplWeighted * (floatval($configs['weight_main_dpl'] ?? 40) / 100)) +
                ($villageWeighted * (floatval($configs['weight_main_village'] ?? 20) / 100)) +
                ($lppmWeighted * (floatval($configs['weight_main_lppm'] ?? 40) / 100))
            );

            // 5. Map to Grade & Index
            $gradeData = GradeConversionService::convert($totalScore);

            // 6. Update Record
            $nilai->update([
                'dpl_weighted_score' => round($dplWeighted, 2),
                'village_weighted_score' => round($villageWeighted, 2),
                'lppm_weighted_score' => round($lppmWeighted, 2),
                'total_score' => round($totalScore, 2),
                'letter_grade' => $gradeData['grade'],
                'admin_graded_at' => Carbon::now(),
                'is_finalized' => true,
            ]);

            // 7. Audit logging
            AuditService::log(
                'FINALIZE_NILAI_AKHIR',
                "Memfinalisasi nilai mahasiswa: {$mahasiswaId}, Total Score: {$totalScore}, Grade: {$gradeData['grade']}",
                $nilai,
                null,
                ['total_score' => round($totalScore, 2), 'letter_grade' => $gradeData['grade']]
            );

            return $nilai;
        });
    }
}
