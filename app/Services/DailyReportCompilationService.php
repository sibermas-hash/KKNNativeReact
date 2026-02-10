<?php

namespace App\Services;

use App\Models\DailyReport;
use App\Models\Group;
use App\Models\Registration;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;

class DailyReportCompilationService
{
    /**
     * Generate PDF compilation of daily reports for a student.
     */
    public function generateForStudent(int $userId): \Barryvdh\DomPDF\PDF
    {
        $user = User::with(['student.program.faculty'])->findOrFail($userId);

        // Get student's registration and group
        $registration = Registration::with(['group.location', 'group.lecturer.user'])
            ->where('user_id', $userId)
            ->latest()
            ->first();

        // Get daily reports
        $reports = DailyReport::where('student_id', $user->student->id)
            ->orderBy('date')
            ->get();

        // Calculate statistics
        $stats = [
            'total' => $reports->count(),
            'approved' => $reports->where('status', 'approved')->count(),
            'pending' => $reports->where('status', 'submitted')->count(), // submitted is pending in this context
            'revision' => $reports->where('status', 'revision')->count(),
            'rejected' => $reports->where('status', 'rejected')->count(),
            'completion_rate' => $reports->count() > 0
                ? round(($reports->where('status', 'approved')->count() / $reports->count()) * 100, 2)
                : 0,
        ];

        $pdf = PDF::loadView('pdf.daily-report-compilation', [
            'user' => $user,
            'registration' => $registration,
            'reports' => $reports,
            'stats' => $stats,
            'generatedAt' => now()->format('d F Y H:i'),
        ]);

        $pdf->setPaper('A4');

        return $pdf;
    }

    /**
     * Generate PDF summary of daily reports for a group.
     */
    public function generateForGroup(int $groupId): \Barryvdh\DomPDF\PDF
    {
        $group = Group::with(['location', 'lecturer.user', 'registrations.user'])->findOrFail($groupId);

        $studentIds = $group->registrations->pluck('student_id');

        $reports = DailyReport::whereIn('student_id', $studentIds)
            ->with('user')
            ->orderBy('date')
            ->get();

        $pdf = PDF::loadView('pdf.group-report-summary', [
            'group' => $group,
            'reports' => $reports,
            'generatedAt' => now()->format('d F Y H:i'),
        ]);

        $pdf->setPaper('A4');

        return $pdf;
    }
}
