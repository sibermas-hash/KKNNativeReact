<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\DashboardStatisticsService;
use App\Services\MasterApi;
use App\Services\PeriodContextService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardStatisticsService $statsService,
        private PeriodContextService $contextService,
    ) {}

    public function index(): Response
    {
        $periodId = $this->contextService->getActivePeriodId();

        return Inertia::render('Admin/Dashboard', [
            'masterGroups' => Inertia::defer(function (MasterApi $api) {
                return $api->getGroups();
            }),
            'stats' => Inertia::defer(function () use ($periodId) {
                if (!$periodId) {
                    return [
                        'total_students' => 0,
                        'total_groups' => 0,
                        'total_reports' => 0,
                        'pending_registrations' => 0,
                        'total_work_programs' => 0,
                        'total_final_reports' => 0,
                        'active_period' => '-',
                    ];
                }

                $statistics = $this->statsService->getPeriodStatistics($periodId);
                $periodData = $this->contextService->getActivePeriodData();

                return array_merge(
                    $statistics['summary'],
                    ['active_period' => $periodData['name'] ?? '-']
                );
            }),
            'sdg_distribution' => Inertia::defer(function () use ($periodId) {
                if (!$periodId) {
                    return [];
                }
                $statistics = $this->statsService->getPeriodStatistics($periodId);
                return $statistics['sdg_distribution'];
            }),
            'recentRegistrations' => Inertia::defer(function () use ($periodId) {
                if (!$periodId) {
                    return [];
                }
                return \App\Models\KKN\PesertaKkn::with(['mahasiswa.user', 'periode'])
                    ->where('period_id', $periodId)
                    ->latest()
                    ->take(5)
                    ->get();
            }),
        ]);
    }
}

