<?php

namespace App\Http\Controllers;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Services\DailyReportCompilationService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ReportExportController extends Controller
{
    public function __construct(
        private DailyReportCompilationService $compilationService
    ) {}

    /**
     * Download student's own daily report compilation.
     */
    public function downloadMyDailyReports(): Response
    {
        $userId = auth()->id();
        $user = auth()->user();
        
        $pdf = $this->compilationService->generateForStudent($userId);
        $filename = "Laporan_Harian_KKN_{$user->name}.pdf";
        
        return $pdf->download($filename);
    }

    /**
     * Download daily report compilation for a specific student (Admin/DPL).
     */
    public function downloadStudentDailyReports(int $studentId): Response
    {
        $mahasiswa = Mahasiswa::with('user')->findOrFail($studentId);
        
        $pdf = $this->compilationService->generateForStudent($mahasiswa->user_id);
        $filename = "Laporan_Harian_KKN_{$mahasiswa->user->name}.pdf";
        
        return $pdf->download($filename);
    }

    /**
     * Download daily report summary for a group (Admin/DPL).
     */
    public function downloadGroupDailyReports(int $groupId): Response
    {
        $kelompok = KelompokKkn::findOrFail($groupId);
        
        $pdf = $this->compilationService->generateForGroup($groupId);
        $filename = "Ringkasan_Laporan_Kelompok_{$kelompok->code}.pdf";
        
        return $pdf->download($filename);
    }
}
