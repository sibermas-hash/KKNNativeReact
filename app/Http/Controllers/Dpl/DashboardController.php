<?php

namespace App\Http\Controllers\Dpl;

use App\Http\Controllers\Controller;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $dosen = $user->dosen;

        $kelompok = $dosen
            ?KelompokKkn::where('dpl_id', $dosen->id)
            ->withCount(['peserta', 'kegiatan'])
            ->with(['lokasi', 'periode'])
            ->get()
            : collect();

        $pendingReports = $dosen
            ?KegiatanKkn::whereIn('kelompok_id', $kelompok->pluck('id'))
            ->where('status', 'submitted')
            ->count()
            : 0;

        $totalStudents = $kelompok->sum('peserta_count');
        $gradedCount = $dosen
            ?\App\Models\KKN\NilaiKkn::whereIn('kelompok_id', $kelompok->pluck('id'))
            ->whereNotNull('dpl_graded_at')
            ->count()
            : 0;

        $gradingProgress = $totalStudents > 0 ? round(($gradedCount / $totalStudents) * 100) : 0;

        // Smart Flagging: Students who haven't posted in 3 days
        $atRiskStudents = $dosen && $totalStudents > 0
            ?\App\Models\KKN\Mahasiswa::whereHas('peserta', function ($q) use ($kelompok) {
            $q->whereIn('kelompok_id', $kelompok->pluck('id'))->where('status', 'approved');
        })
            ->whereDoesntHave('kegiatan', function ($q) {
            $q->where('date', '>=', now()->subDays(3));
        })
            ->with(['user', 'peserta.kelompok'])
            ->get()
            : collect();

        // Logbook Activity Trend (Last 14 days)
        $activityTrend = $dosen
            ?KegiatanKkn::whereIn('kelompok_id', $kelompok->pluck('id'))
            ->where('date', '>=', now()->subDays(14))
            ->selectRaw('date, count(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            : collect();

        return Inertia::render('Dpl/Dashboard', [
            'groups' => $kelompok,
            'pendingReports' => $pendingReports,
            'gradingProgress' => "{$gradingProgress}%",
            'atRiskStudents' => $atRiskStudents,
            'activityTrend' => $activityTrend,
        ]);
    }
}