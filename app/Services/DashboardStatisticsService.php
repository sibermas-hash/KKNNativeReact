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
     * Get comprehensive statistics for a specific period, optionally scoped by faculty.
     */
    public function getPeriodStatistics(int $periodId, ?int $facultyId = null): array
    {
        $cacheKey = "dashboard:period:{$periodId}:faculty:" . ($facultyId ?? 'global');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($periodId, $facultyId) {
            return [
                'summary' => $this->getSummaryStats($periodId, $facultyId),
                'students_by_status' => $this->getStudentsByStatus($periodId, $facultyId),
                'grade_distribution' => $this->getGradeDistribution($periodId, $facultyId),
                'dpl_workload' => $this->getDplWorkload($periodId, $facultyId),
                'sdg_distribution' => $this->getSdgDistribution($periodId, $facultyId),
            ];
        });
    }

    /**
     * Get summary counts for the dashboard cards.
     */
    private function getSummaryStats(int $periodId, ?int $facultyId = null): array
    {
        $studentQuery = PesertaKkn::where('period_id', $periodId);
        $groupQuery = KelompokKkn::where('period_id', $periodId);
        $reportQuery = KegiatanKkn::whereHas('kelompok', function ($q) use ($periodId) {
            $q->where('period_id', $periodId);
        });
        $wpQuery = ProgramKerja::whereHas('kelompok', function ($q) use ($periodId) {
            $q->where('period_id', $periodId);
        });
        $finalReportQuery = LaporanAkhir::whereHas('kelompok', function ($q) use ($periodId) {
            $q->where('period_id', $periodId);
        });

        if ($facultyId) {
            $studentQuery->whereHas('mahasiswa', fn($q) => $q->where('faculty_id', $facultyId));
            $groupQuery->whereHas('peserta.mahasiswa', fn($q) => $q->where('faculty_id', $facultyId));
            $reportQuery->whereHas('mahasiswa', fn($q) => $q->where('faculty_id', $facultyId));
            $wpQuery->whereHas('kelompok.peserta.mahasiswa', fn($q) => $q->where('faculty_id', $facultyId));
            $finalReportQuery->whereHas('mahasiswa', fn($q) => $q->where('faculty_id', $facultyId));
        }

        $totalStudents = (clone $studentQuery)->count();
        $totalGroups = (clone $groupQuery)->distinct('kelompok_kkn.id')->count();
        $totalReports = (clone $reportQuery)->count();
        $pendingRegistrations = (clone $studentQuery)->where('status', 'pending')->count();
        $totalWorkPrograms = (clone $wpQuery)->count();
        $totalFinalReports = (clone $finalReportQuery)->count();
        
        $assignedStudents = (clone $studentQuery)->whereNotNull('kelompok_id')->count();
        $unassignedStudents = (clone $studentQuery)->whereNull('kelompok_id')->count();
        
        $poskoQuery = \App\Models\KKN\PoskoKelompok::whereHas('kelompok', function ($q) use ($periodId) {
            $q->where('period_id', $periodId);
        });
        if ($facultyId) {
            $poskoQuery->whereHas('kelompok.peserta.mahasiswa', fn($q) => $q->where('faculty_id', $facultyId));
        }
        $reportedPosko = $poskoQuery->count();

        return [
            'total_students' => $totalStudents,
            'total_groups' => $totalGroups,
            'total_reports' => $totalReports,
            'pending_registrations' => $pendingRegistrations,
            'total_work_programs' => $totalWorkPrograms,
            'total_final_reports' => $totalFinalReports,
            'assigned_students' => $assignedStudents,
            'unassigned_students' => $unassignedStudents,
            'reported_posko' => $reportedPosko,
        ];
    }

    /**
     * Get student registration counts by status.
     */
    private function getStudentsByStatus(int $periodId, ?int $facultyId = null): array
    {
        $query = DB::connection('kkn')
            ->table('peserta_kkn')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->where('period_id', $periodId)
            ->whereNull('deleted_at');

        if ($facultyId) {
            $query->join('mahasiswa', 'peserta_kkn.mahasiswa_id', '=', 'mahasiswa.id')
                  ->where('mahasiswa.faculty_id', $facultyId);
        }

        return $query->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();
    }

    /**
     * Get grade distribution for finalized scores.
     */
    private function getGradeDistribution(int $periodId, ?int $facultyId = null): array
    {
        $query = DB::connection('kkn')
            ->table('nilai_kkn')
            ->select('letter_grade', DB::raw('COUNT(*) as count'))
            ->join('kelompok_kkn', 'nilai_kkn.kelompok_id', '=', 'kelompok_kkn.id')
            ->where('kelompok_kkn.period_id', $periodId)
            ->where('nilai_kkn.is_finalized', true)
            ->whereNull('kelompok_kkn.deleted_at');

        if ($facultyId) {
            $query->join('peserta_kkn', 'nilai_kkn.kelompok_id', '=', 'peserta_kkn.kelompok_id')
                  ->join('mahasiswa', 'peserta_kkn.mahasiswa_id', '=', 'mahasiswa.id')
                  ->where('mahasiswa.faculty_id', $facultyId)
                  ->distinct(); // Avoid double counting if multiple students in same group
        }

        return $query->groupBy('letter_grade')
            ->pluck('count', 'letter_grade')
            ->toArray();
    }

    /**
     * Get DPL workload (groups and students per DPL).
     */
    private function getDplWorkload(int $periodId, ?int $facultyId = null): array
    {
        $query = DB::connection('kkn')
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
            ->whereNull('kelompok_kkn.deleted_at');

        if ($facultyId) {
            $query->join('mahasiswa', 'peserta_kkn.mahasiswa_id', '=', 'mahasiswa.id')
                  ->where('mahasiswa.faculty_id', $facultyId);
        }

        return $query->groupBy('dosen.id', 'dosen.nama', 'dosen.nip')
            ->orderByDesc('total_groups')
            ->get()
            ->toArray();
    }

    /**
     * Get SDG distribution from work programs.
     */
    private function getSdgDistribution(int $periodId, ?int $facultyId = null): array
    {
        $query = ProgramKerja::whereHas('kelompok', function ($q) use ($periodId) {
            $q->where('period_id', $periodId);
        })
        ->whereNotNull('sdg_goals');

        if ($facultyId) {
            $query->whereHas('kelompok.peserta.mahasiswa', fn($q) => $q->where('faculty_id', $facultyId));
        }

        $rawSdgs = $query->select('sdg_goals')
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
    public function clearCache(int $periodId, ?int $facultyId = null): void
    {
        $facultyKey = $facultyId ?? 'global';
        Cache::forget("dashboard:period:{$periodId}:faculty:{$facultyKey}");
    }
}
