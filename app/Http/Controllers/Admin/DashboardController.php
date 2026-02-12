<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\ProgramKerja;
use App\Models\KKN\LaporanAkhir;
use App\Services\MasterApi;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $activePeriod = Periode::getActivePeriod();

        return Inertia::render('Admin/Dashboard', [
            'masterGroups' => Inertia::defer(function (MasterApi $api) {
                return $api->getGroups();
            }),
            'stats' => Inertia::defer(function () use ($activePeriod) {
                return [
                    'total_students' => Mahasiswa::count(),
                    'total_groups' => KelompokKkn::count(),
                    'total_reports' => KegiatanKkn::count(),
                    'pending_registrations' => PesertaKkn::where('status', 'pending')->count(),
                    'active_period' => $activePeriod?->name ?? '-',
                    'total_work_programs' => ProgramKerja::count(),
                    'total_final_reports' => LaporanAkhir::count(),
                ];
            }),
            'sdg_distribution' => Inertia::defer(function () {
                $rawSdgs = ProgramKerja::select('sdg_goals')
                    ->whereNotNull('sdg_goals')
                    ->get()
                    ->flatMap(fn($wp) => (array)$wp->sdg_goals);
                
                return $rawSdgs->countBy()->map(function($count, $id) {
                    return [
                        'id' => (int)$id,
                        'count' => $count,
                    ];
                })->values();
            }),
            'recentRegistrations' => Inertia::defer(fn() => PesertaKkn::with(['mahasiswa.user', 'period'])
                ->latest()
                ->take(5)
                ->get()),
        ]);
    }
}
