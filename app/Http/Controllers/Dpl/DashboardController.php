<?php

declare(strict_types=1);

namespace App\Http\Controllers\Dpl;

use App\Http\Controllers\Controller;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\NilaiKkn;
use App\Services\DplScopeService;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private DplScopeService $scopeService,
    ) {}

    public function index(): Response|\Illuminate\Http\RedirectResponse
    {
        $user = auth()->user();

        // If profile is still incomplete (must_change_password still true after first login), lock to profile page
        if ($user->must_change_password) {
            return redirect()->route('profile.show')->with('error', 'Profil belum lengkap! Anda harus melengkapi semua data terlebih dahulu.');
        }
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
            ? Mahasiswa::query()
                ->select(['id', 'user_id', 'nama', 'nim'])
                ->whereHas('peserta', function ($q) use ($groupIds) {
                    $q->whereIn('kelompok_id', $groupIds)->where('status', 'approved');
                })
                ->whereNotExists(function ($q) {
                    $q->select(DB::raw(1))
                        ->from('kegiatan_kkn')
                        ->whereColumn('kegiatan_kkn.mahasiswa_id', 'mahasiswa.id')
                        ->where('kegiatan_kkn.date', '>=', now()->subDays(3)->format('Y-m-d'));
                })
                ->with(['user:id,name', 'peserta' => function ($q) use ($groupIds) {
                    $q->whereIn('kelompok_id', $groupIds)->select(['id', 'mahasiswa_id', 'kelompok_id']);
                }, 'peserta.kelompok:id,code'])
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
