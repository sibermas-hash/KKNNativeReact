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
            ?PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
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

        $grade = $mahasiswa
            ?\App\Models\KKN\NilaiKkn::where('mahasiswa_id', $user->id) // Note: NilaiKkn uses user_id as foreign key according to other parts of code
            ->where('is_finalized', true)
            ->first()
            : null;

        return Inertia::render('Student/Dashboard', [
            'student' => $mahasiswa,
            'registration' => $registration,
            'dailyReportCount' => $dailyReportCount,
            'finalReport' => $finalReport,
            'grade' => $grade,
        ]);
    }
}