<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\PesertaKkn;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $mahasiswa = $user->mahasiswa;

        $registration = $mahasiswa
            ? PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
                ->with('periode', 'kelompok.lokasi', 'kelompok.dpl')
                ->latest()
                ->first()
            : null;

        $dailyReportCount = $mahasiswa
            ? $mahasiswa->kegiatan()->count()
            : 0;

        $finalReport = $mahasiswa
            ? $mahasiswa->laporanAkhir()->latest()->first()
            : null;

        return Inertia::render('Student/Dashboard', [
            'student' => $mahasiswa,
            'registration' => $registration,
            'dailyReportCount' => $dailyReportCount,
            'finalReport' => $finalReport,
        ]);
    }
}
