<?php

namespace App\Http\Controllers\Dpl;

use App\Http\Controllers\Controller;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\NilaiKkn;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $dosen = $user->dosen;

        if (!$dosen) {
            return Inertia::render('Dpl/Dashboard', [
                'groups' => [],
                'pendingReports' => 0,
                'gradingProgress' => "0%",
                'atRiskStudents' => [],
                'activityTrend' => [],
            ]);
        }

        // Multi-DPL Logic: Fetch all groups assigned to this lecturer through the pivot table
        $kelompok = $dosen->kelompokKkn()
            ->withCount(['peserta' => function($q) {
                $q->where('status', 'approved');
            }, 'kegiatan'])
            ->with(['lokasi', 'periode'])
            ->get();

        $groupIds = $kelompok->pluck('id');

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
            ->with(['user', 'peserta' => function($q) use ($groupIds) {
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

        return Inertia::render('Dpl/Dashboard', [
            'groups' => $kelompok,
            'pendingReports' => $pendingReports,
            'gradingProgress' => "{$gradingProgress}%",
            'atRiskStudents' => $atRiskStudents,
            'activityTrend' => $activityTrend,
        ]);
    }
}
