<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DailyReport;
use App\Models\Group;
use App\Models\Registration;
use App\Models\Student;
use App\Models\Period;
use App\Models\WorkProgram;
use App\Models\FinalReport;
use App\Services\MasterApi;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $activePeriod = Period::getActivePeriod();

        return Inertia::render('Admin/Dashboard', [
            'masterGroups' => Inertia::defer(function (MasterApi $api) {
                return $api->getGroups();
            }),
            'stats' => Inertia::defer(function () use ($activePeriod) {
                return [
                    'total_students' => \App\Models\Student::count(),
                    'total_groups' => \App\Models\Group::count(),
                    'total_reports' => \App\Models\DailyReport::count(),
                    'pending_registrations' => \App\Models\Registration::where('status', 'pending')->count(),
                    'active_period' => $activePeriod?->name ?? '-',
                    'total_work_programs' => \App\Models\WorkProgram::count(),
                    'total_final_reports' => \App\Models\FinalReport::count(),
                ];
            }),
            'sdg_distribution' => Inertia::defer(function () {
                $rawSdgs = \App\Models\WorkProgram::select('sdg_goals')
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
            'recentRegistrations' => Inertia::defer(fn() => \App\Models\Registration::with(['student.user', 'period'])
                ->latest()
                ->take(5)
                ->get()),
        ]);
    }
}
