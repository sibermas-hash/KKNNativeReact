<?php

namespace App\Services;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\ProgramKerja;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardStatisticsService
{
    private const CACHE_TTL = 300; // 5 minutes

    /**
     * Get comprehensive statistics for a specific period.
     */
    public function getPeriodStatistics(int $periodId): array
    {
        $cacheKey = "dashboard:period:{$periodId}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($periodId) {
            return [
                'summary' => $this->getSummaryStats($periodId),
                'students_by_status' => $this->getStudentsByStatus($periodId),
                'grade_distribution' => $this->getGradeDistribution($periodId),
                'dpl_workload' => $this->getDplWorkload($periodId),
                'sdg_distribution' => $this->getSdgDistribution($periodId),
            ];
        });
    }

    /**
     * Get summary counts for the dashboard cards.
     */
    private function getSummaryStats(int $periodId): array
    {
        $totalStudents = PesertaKkn::where('period_id', $periodId)->count();
        $totalGroups = KelompokKkn::where('period_id', $periodId)->count();
        $totalReports = KegiatanKkn::whereHas('kelompok', function ($q) use ($periodId) {
            $q->where('period_id', $periodId);
        })->count();
        $pendingRegistrations = PesertaKkn::where('period_id', $periodId)
            ->where('status', 'pending')
            ->count();
        $totalWorkPrograms = ProgramKerja::whereHas('kelompok', function ($q) use ($periodId) {
            $q->where('period_id', $periodId);
        })->count();
        $totalFinalReports = LaporanAkhir::whereHas('kelompok', function ($q) use ($periodId) {
            $q->where('period_id', $periodId);
        })->count();
        $assignedStudents = PesertaKkn::where('period_id', $periodId)
            ->whereNotNull('kelompok_id')
            ->count();
        $unassignedStudents = PesertaKkn::where('period_id', $periodId)
            ->whereNull('kelompok_id')
            ->count();

        return [
            'total_students' => $totalStudents,
            'total_groups' => $totalGroups,
            'total_reports' => $totalReports,
            'pending_registrations' => $pendingRegistrations,
            'total_work_programs' => $totalWorkPrograms,
            'total_final_reports' => $totalFinalReports,
            'assigned_students' => $assignedStudents,
            'unassigned_students' => $unassignedStudents,
        ];
    }

    /**
     * Get student registration counts by status.
     */
    private function getStudentsByStatus(int $periodId): array
    {
        return DB::connection('kkn')
            ->table('peserta_kkn')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->where('period_id', $periodId)
            ->whereNull('deleted_at')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();
    }

    /**
     * Get grade distribution for finalized scores.
     */
    private function getGradeDistribution(int $periodId): array
    {
        return DB::connection('kkn')
            ->table('nilai_kkn')
            ->select('letter_grade', DB::raw('COUNT(*) as count'))
            ->join('kelompok_kkn', 'nilai_kkn.kelompok_id', '=', 'kelompok_kkn.id')
            ->where('kelompok_kkn.period_id', $periodId)
            ->where('nilai_kkn.is_finalized', true)
            ->whereNull('kelompok_kkn.deleted_at')
            ->groupBy('letter_grade')
            ->pluck('count', 'letter_grade')
            ->toArray();
    }

    /**
     * Get DPL workload (groups and students per DPL).
     */
    private function getDplWorkload(int $periodId): array
    {
        return DB::connection('kkn')
            ->table('kelompok_kkn')
            ->select(
                'dosen.nama as dpl_name',
                'dosen.nip',
                DB::raw('COUNT(DISTINCT kelompok_kkn.id) as total_groups'),
                DB::raw('COUNT(DISTINCT peserta_kkn.id) as total_students')
            )
            ->join('dosen', 'kelompok_kkn.dpl_id', '=', 'dosen.id')
            ->leftJoin('peserta_kkn', 'kelompok_kkn.id', '=', 'peserta_kkn.kelompok_id')
            ->where('kelompok_kkn.period_id', $periodId)
            ->whereNull('kelompok_kkn.deleted_at')
            ->groupBy('dosen.id', 'dosen.nama', 'dosen.nip')
            ->orderByDesc('total_groups')
            ->get()
            ->toArray();
    }

    /**
     * Get SDG distribution from work programs.
     */
    private function getSdgDistribution(int $periodId): array
    {
        $rawSdgs = ProgramKerja::whereHas('kelompok', function ($q) use ($periodId) {
            $q->where('period_id', $periodId);
        })
            ->select('sdg_goals')
            ->whereNotNull('sdg_goals')
            ->get()
            ->flatMap(fn($wp) => (array) $wp->sdg_goals);

        return $rawSdgs->countBy()->map(function ($count, $id) {
            return [
                'id' => (int) $id,
                'count' => $count,
            ];
        })->values()->toArray();
    }

    /**
     * Clear cached statistics for a period.
     */
    public function clearCache(int $periodId): void
    {
        Cache::forget("dashboard:period:{$periodId}");
    }
}
