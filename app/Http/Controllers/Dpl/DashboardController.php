<?php

declare(strict_types=1);

namespace App\Http\Controllers\Dpl;

use App\Http\Controllers\Controller;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\NilaiKkn;
use App\Services\DplScopeService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private DplScopeService $scopeService,
    ) {}

    public function index(): Response
    {
        $user = auth()->user();
        $dosen = $user->dosen;

        if (! $dosen) {
            return Inertia::render('Dpl/Dashboard', [
                'groups' => [],
                'pendingReports' => 0,
                'gradingProgress' => '0%',
                'atRiskStudents' => [],
                'activityTrend' => [],
                'coordinatorAreas' => [],
            ]);
        }

        $groupIds = $this->scopeService->assignedGroupIds($dosen);

        $kelompok = KelompokKkn::query()
            ->whereIn('id', $groupIds)
            ->withCount(['peserta' => function ($q) {
                $q->where('status', 'approved');
            }, 'kegiatan'])
            ->with(['lokasi', 'periode'])
            ->get();

        $pendingReports = KegiatanKkn::whereIn('kelompok_id', $groupIds)
            ->where('status', 'submitted')
            ->count();

        $totalStudents = $kelompok->sum('peserta_count');

        $gradedCount = NilaiKkn::whereIn('kelompok_id', $groupIds)
            ->whereNotNull('dpl_graded_at')
            ->count();

        $gradingProgress = $totalStudents > 0 ? round(($gradedCount / $totalStudents) * 100) : 0;

        // Smart Flagging: Students in assigned groups who haven't posted in 3 days
        $atRiskStudents = $totalStudents > 0
            ? Mahasiswa::whereHas('peserta', function ($q) use ($groupIds) {
                $q->whereIn('kelompok_id', $groupIds)->where('status', 'approved');
            })
                ->whereDoesntHave('kegiatan', function ($q) {
                    $q->where('date', '>=', now()->subDays(3));
                })
                ->with(['user', 'peserta' => function ($q) use ($groupIds) {
                    $q->whereIn('kelompok_id', $groupIds);
                }, 'peserta.kelompok'])
                ->get()
            : collect();

        // Logbook Activity Trend (Last 14 days)
        $activityTrend = KegiatanKkn::whereIn('kelompok_id', $groupIds)
            ->where('date', '>=', now()->subDays(14))
            ->selectRaw('date, count(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $coordinatorAreas = $this->scopeService->coordinatorAreaSummaries($dosen);

        return Inertia::render('Dpl/Dashboard', [
            'groups' => $kelompok->map(fn (KelompokKkn $group) => [
                'id' => $group->id,
                'code' => $group->code,
                'name' => $group->nama_kelompok,
                'period_name' => $group->periode?->name ?? '-',
                'jenis_kkn' => $group->periode?->jenis_label ?? '-',
                'village_name' => $group->lokasi?->village_name ?? '-',
                'member_count' => $group->peserta_count,
                'daily_report_count' => $group->kegiatan_count,
            ])->values(),
            'pendingReports' => $pendingReports,
            'gradingProgress' => "{$gradingProgress}%",
            'atRiskStudents' => $atRiskStudents->map(fn (Mahasiswa $student) => [
                'id' => $student->id,
                'name' => $student->user?->name ?? $student->nama,
                'nim' => $student->nim,
                'group_code' => $student->peserta->first()?->kelompok?->code ?? '-',
            ])->values(),
            'activityTrend' => $activityTrend->map(fn ($item) => [
                'date' => (string) $item->date,
                'count' => (int) $item->count,
            ])->values(),
            'coordinatorAreas' => $coordinatorAreas,
        ]);
    }
}
