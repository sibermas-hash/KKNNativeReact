<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\PoskoKelompok;
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
        $cacheKey = "dashboard:period:{$periodId}:faculty:".($facultyId ?? 'global');

        try {
            return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($periodId, $facultyId) {
                return [
                    'summary' => $this->getSummaryStats($periodId, $facultyId),
                    'students_by_status' => $this->getStudentsByStatus($periodId, $facultyId),
                    'grade_distribution' => $this->getGradeDistribution($periodId, $facultyId),
                    'dpl_workload' => $this->getDplWorkload($periodId, $facultyId),
                    'sdg_distribution' => $this->getSdgDistribution($periodId, $facultyId),
                ];
            });
        } catch (\Throwable $e) {
            report($e);

            return [
                'summary' => ['total_students' => 0, 'total_groups' => 0],
                'students_by_status' => [],
                'grade_distribution' => [],
                'dpl_workload' => [],
                'sdg_distribution' => [],
            ];
        }
    }

    /**
     * Get summary counts for the dashboard cards.
     */
    private function getSummaryStats(int $periodId, ?int $facultyId = null): array
    {
        $studentQuery = PesertaKkn::where('periode_id', $periodId);
        $groupQuery = KelompokKkn::where('periode_id', $periodId);

        // Optimasi: Gunakan query yang lebih spesifik untuk tabel besar (kegiatan_kkn)
        // Gunakan whereExists jika fakultas dispesifikasikan agar tidak melakukan join besar
        $reportQuery = KegiatanKkn::whereIn('kelompok_id', function ($sub) use ($periodId) {
            $sub->select('id')->from('kelompok_kkn')->where('periode_id', $periodId);
        });

        if ($facultyId) {
            $studentQuery->whereHas('mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
            $groupQuery->whereHas('peserta.mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
            $reportQuery->whereHas('mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
        }

        // Jalankan count secara independen untuk performa
        $totalStudents = $studentQuery->count();
        $totalGroups = $groupQuery->count();
        $totalReports = $reportQuery->count();

        $pendingRegistrations = (clone $studentQuery)->where('status', 'pending')->count();

        $assignedStudents = (clone $studentQuery)->whereNotNull('kelompok_id')->count();
        $unassignedStudents = $totalStudents - $assignedStudents;

        $poskoQuery = PoskoKelompok::whereIn('kelompok_id', function ($sub) use ($periodId) {
            $sub->select('id')->from('kelompok_kkn')->where('periode_id', $periodId);
        });

        if ($facultyId) {
            $poskoQuery->whereHas('kelompok.peserta.mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
        }
        $reportedPosko = $poskoQuery->count();

        return [
            'total_students' => $totalStudents,
            'total_groups' => $totalGroups,
            'total_reports' => $totalReports,
            'pending_registrations' => $pendingRegistrations,
            'total_work_programs' => 0, // Didefer di frontend jika perlu
            'total_final_reports' => 0, // Didefer di frontend jika perlu
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
        $query = PesertaKkn::query()
            ->select('status', DB::raw('COUNT(*) as count'))
            ->where('periode_id', $periodId);

        if ($facultyId) {
            $query->join('mahasiswa', 'peserta_kkn.mahasiswa_id', '=', 'mahasiswa.id')
                ->where('mahasiswa.fakultas_id', $facultyId);
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
        $query = NilaiKkn::query()
            ->select('letter_grade', DB::raw('COUNT(*) as count'))
            ->join('kelompok_kkn', 'nilai_kkn.kelompok_id', '=', 'kelompok_kkn.id')
            ->where('kelompok_kkn.periode_id', $periodId)
            ->where('nilai_kkn.is_finalized', true)
            ->whereNull('kelompok_kkn.deleted_at');

        if ($facultyId) {
            // Optimasi: Gunakan join ke tabel mahasiswa dengan filter fakultas
            $query->join('mahasiswa', 'nilai_kkn.user_id', '=', 'mahasiswa.user_id')
                ->where('mahasiswa.fakultas_id', $facultyId);
        }

        return $query->groupBy('letter_grade')
            ->pluck('count', 'letter_grade')
            ->mapWithKeys(fn ($count, $grade) => [trim((string) $grade) => $count])
            ->toArray();
    }

    /**
     * Get DPL workload (groups and students per DPL).
     */
    private function getDplWorkload(int $periodId, ?int $facultyId = null): array
    {
        $query = KelompokKkn::query()
            ->select(
                'dosen.nama as dpl_name',
                'dosen.nip',
                DB::raw('COUNT(DISTINCT kelompok_kkn.id) as total_groups'),
                DB::raw('COUNT(DISTINCT peserta_kkn.id) as total_students')
            )
            ->join('dosen', 'kelompok_kkn.dpl_id', '=', 'dosen.id')
            ->leftJoin('peserta_kkn', 'kelompok_kkn.id', '=', 'peserta_kkn.kelompok_id')
            ->where('kelompok_kkn.periode_id', $periodId)
            ->whereNotNull('kelompok_kkn.dpl_id');

        if ($facultyId) {
            $query->join('mahasiswa', 'peserta_kkn.mahasiswa_id', '=', 'mahasiswa.id')
                ->where('mahasiswa.fakultas_id', $facultyId);
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
            $q->where('periode_id', $periodId);
        })
            ->whereNotNull('sdg_goals');

        if ($facultyId) {
            $query->whereHas('kelompok.peserta.mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
        }

        $rawSdgs = $query->select('sdg_goals')
            ->get()
            ->flatMap(fn ($wp) => (array) $wp->sdg_goals);

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
