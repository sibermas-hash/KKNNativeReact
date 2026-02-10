<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\Registration;
use App\Models\Student;
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
        // Add authorization check here if needed, or rely on route middleware
        $student = Student::with('user')->findOrFail($studentId);
        
        $pdf = $this->compilationService->generateForStudent($student->user_id);
        $filename = "Laporan_Harian_KKN_{$student->user->name}.pdf";
        
        return $pdf->download($filename);
    }

    /**
     * Download daily report summary for a group (Admin/DPL).
     */
    public function downloadGroupDailyReports(int $groupId): Response
    {
        $group = Group::findOrFail($groupId);
        
        $pdf = $this->compilationService->generateForGroup($groupId);
        $filename = "Ringkasan_Laporan_Kelompok_{$group->code}.pdf";
        
        return $pdf->download($filename);
    }
}
