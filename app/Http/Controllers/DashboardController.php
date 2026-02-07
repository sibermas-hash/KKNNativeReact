<?php

namespace App\Http\Controllers;

use App\Models\DailyReport;
use App\Models\Group;
use App\Models\Student;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $stats = [
            'total_students' => Student::count(),
            'total_groups' => Group::count(),
            'total_reports' => DailyReport::count(),
        ];

        return Inertia::render('Dashboard', [
            'stats' => $stats,
        ]);
    }
}
