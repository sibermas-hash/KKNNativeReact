<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $student = $user->student;

        $registration = $student
            ? Registration::where('student_id', $student->id)
                ->with('period', 'group.location', 'group.lecturer')
                ->latest()
                ->first()
            : null;

        $dailyReportCount = $student
            ? $student->dailyReports()->count()
            : 0;

        $finalReport = $student
            ? $student->finalReports()->latest()->first()
            : null;

        return Inertia::render('Student/Dashboard', [
            'student' => $student,
            'registration' => $registration,
            'dailyReportCount' => $dailyReportCount,
            'finalReport' => $finalReport,
        ]);
    }
}
