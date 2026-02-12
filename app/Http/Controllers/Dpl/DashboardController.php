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
            ? KelompokKkn::where('dpl_id', $dosen->id)
                ->withCount(['peserta', 'kegiatan'])
                ->with(['lokasi', 'periode'])
                ->get()
            : collect();

        $pendingReports = $dosen
            ? KegiatanKkn::whereIn('kelompok_id', $kelompok->pluck('id'))
                ->where('status', 'submitted')
                ->count()
            : 0;

        return Inertia::render('Dpl/Dashboard', [
            'groups' => $kelompok,
            'pendingReports' => $pendingReports,
        ]);
    }
}
