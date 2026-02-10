<?php

namespace App\Http\Controllers\Dpl;

use App\Http\Controllers\Controller;
use App\Models\DailyReport;
use App\Models\Group;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $lecturer = $user->lecturer;

        $groups = $lecturer
            ? Group::where('lecturer_id', $lecturer->id)
                ->withCount('registrations', 'dailyReports')
                ->with('location', 'period')
                ->get()
            : collect();

        $pendingReports = $lecturer
            ? DailyReport::whereIn('group_id', $groups->pluck('id'))
                ->where('status', 'submitted')
                ->count()
            : 0;

        return Inertia::render('Dpl/Dashboard', [
            'groups' => $groups,
            'pendingReports' => $pendingReports,
        ]);
    }
}
