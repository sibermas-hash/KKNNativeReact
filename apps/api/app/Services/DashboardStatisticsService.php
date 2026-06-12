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
use Illuminate\Support\Facades\Log;

class DashboardStatisticsService
{
    private const CACHE_TTL = 300; // 5 minutes

    /**
     * M-003: Log any dashboard sub-query that exceeds this wall-clock budget.
     * Use `config(['dashboard.slow_query_ms' => 500])` to override per env.
     */
    private const DEFAULT_SLOW_QUERY_MS = 500;

    /**
     * Run a dashboard sub-query, measure wall-clock time, and emit a warning
     * when it crosses the threshold. The label is attached so log readers can
     * identify which computation is expensive without stack-walking.
     *
     * @template T
     *
     * @param  \Closure():T  $callback
     * @return T
     */
    private function measure(string $label, \Closure $callback): mixed
    {
        $start = microtime(true);
        $result = $callback();
        $elapsedMs = (microtime(true) - $start) * 1000;

        $threshold = (int) config('dashboard.slow_query_ms', self::DEFAULT_SLOW_QUERY_MS);
        if ($elapsedMs > $threshold) {
            Log::warning('Slow dashboard query', [
                'label' => $label,
                'elapsed_ms' => round($elapsedMs, 2),
                'threshold_ms' => $threshold,
            ]);
        }

        return $result;
    }

    /**
     * Get comprehensive statistics for a specific period, optionally scoped by faculty.
     */
    public function getPeriodStatistics(int $periodId, ?int $facultyId = null): array
    {
        $cacheKey = "dashboard:period:{$periodId}:faculty:".($facultyId ?? 'global');

        try {
            return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($periodId, $facultyId) {
                return [
                    'summary' => $this->measure('summary', fn () => $this->getSummaryStats($periodId, $facultyId)),
                    'students_by_status' => $this->measure('students_by_status', fn () => $this->getStudentsByStatus($periodId, $facultyId)),
                    'grade_distribution' => $this->measure('grade_distribution', fn () => $this->getGradeDistribution($periodId, $facultyId)),
                    'dpl_workload' => $this->measure('dpl_workload', fn () => $this->getDplWorkload($periodId, $facultyId)),
                    'sdg_distribution' => $this->measure('sdg_distribution', fn () => $this->getSdgDistribution($periodId, $facultyId)),
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

        $onboardingStats = $this->getStudentOnboardingStats($facultyId);

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
            'student_accounts_total' => $onboardingStats['total'],
            'student_not_logged_in' => $onboardingStats['not_logged_in'],
            'student_logged_in_profile_incomplete' => $onboardingStats['logged_in_profile_incomplete'],
            'student_profile_complete' => $onboardingStats['profile_complete'],
        ];
    }

    /**
     * Student onboarding funnel for admin dashboard.
     * Counts are account-level (users with role student), not period registration counts.
     */
    private function getStudentOnboardingStats(?int $facultyId = null): array
    {
        $base = DB::table('users')
            ->join('model_has_roles', function ($join) {
                $join->on('model_has_roles.model_id', '=', 'users.id')
                    ->where('model_has_roles.model_type', '=', 'App\\Models\\User');
            })
            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->leftJoin('mahasiswa', 'mahasiswa.user_id', '=', 'users.id')
            ->where('roles.name', 'student')
            ->whereNull('users.deleted_at');

        if ($facultyId) {
            $base->where('mahasiswa.fakultas_id', $facultyId);
        }

        $completeCondition = function ($q): void {
            $q->whereNotNull('users.avatar')
                ->whereNotNull('users.phone')
                ->whereNotNull('users.address')
                ->whereNotNull('mahasiswa.nik')
                ->whereNotNull('mahasiswa.mother_name')
                ->whereNotNull('mahasiswa.birth_place')
                ->whereNotNull('mahasiswa.birth_date')
                ->whereNotNull('mahasiswa.gender')
                ->whereNotNull('mahasiswa.shirt_size');
        };

        $total = (clone $base)->count();
        $profileComplete = (clone $base)->where($completeCondition)->count();
        // Default-password account = belum menyelesaikan first-login.
        // Banyak phone/address terisi dari SIAKAD/import, jadi "profile kosong"
        // tidak boleh ditafsirkan semua kolom null. Avatar null adalah indikator
        // kuat user belum pernah menyelesaikan onboarding profil.
        $notLoggedIn = (clone $base)
            ->where('users.must_change_password', true)
            ->whereNull('users.avatar')
            ->count();
        $loggedInIncomplete = (clone $base)
            ->where('users.must_change_password', false)
            ->whereNot($completeCondition)
            ->count();

        return [
            'total' => (int) $total,
            'not_logged_in' => (int) $notLoggedIn,
            'logged_in_profile_incomplete' => (int) $loggedInIncomplete,
            'profile_complete' => (int) $profileComplete,
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
     * Get weekly registration & validation trend (last 7 days).
     */
    public function getWeeklyTrend(int $periodId): array
    {
        $cacheKey = "dashboard:weekly_trend:{$periodId}";

        return Cache::remember($cacheKey, 300, function () use ($periodId) {
            $days = collect(range(6, 0))->map(fn ($i) => now()->subDays($i)->format('Y-m-d'));
            $from = now()->subDays(6)->startOfDay();
            $to = now()->endOfDay();

            $registrations = PesertaKkn::where('periode_id', $periodId)
                ->whereBetween('created_at', [$from, $to])
                ->select(DB::raw('DATE(created_at) as day'), DB::raw('COUNT(*) as count'))
                ->groupBy(DB::raw('DATE(created_at)'))
                ->pluck('count', 'day');

            $validations = PesertaKkn::where('periode_id', $periodId)
                ->whereBetween('updated_at', [$from, $to])
                ->whereIn('status', ['approved', 'rejected'])
                ->select(DB::raw('DATE(updated_at) as day'), DB::raw('COUNT(*) as count'))
                ->groupBy(DB::raw('DATE(updated_at)'))
                ->pluck('count', 'day');

            $dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

            return $days->map(function ($date) use ($registrations, $validations, $dayNames) {
                $dow = (int) date('w', strtotime($date));

                return [
                    'day' => $dayNames[$dow],
                    'daftar' => (int) ($registrations[$date] ?? 0),
                    'validasi' => (int) ($validations[$date] ?? 0),
                ];
            })->values()->toArray();
        });
    }

    /**
     * Clear cached statistics for a period.
     */
    public function clearCache(int $periodId, ?int $facultyId = null): void
    {
        $facultyKey = $facultyId ?? 'global';
        Cache::forget("dashboard:period:{$periodId}:faculty:{$facultyKey}");
        Cache::forget("dashboard:weekly_trend:{$periodId}");
    }
}
