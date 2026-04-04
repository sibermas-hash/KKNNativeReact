<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\DashboardStatisticsService;
use App\Services\MasterApiService;
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
        $user = auth()->user();
        $isFacultyAdmin = $user?->hasRole('faculty_admin');
        $facultyId = $isFacultyAdmin ? $user?->faculty_id : null;

        return Inertia::render('Admin/Dashboard', [
            'masterGroups' => Inertia::defer(function (MasterApiService $api) {
                return $api->getGroups();
            }),
            'demoPreview' => [
                'stats' => [
                    'total_students' => 248,
                    'total_groups' => 32,
                    'total_reports' => 186,
                    'pending_registrations' => 14,
                ],
                'recentRegistrations' => [
                    [
                        'id' => 900001,
                        'status' => 'pending',
                        'mahasiswa' => [
                            'nim' => '2310401001',
                            'user' => ['name' => 'Aisyah Nur Hidayah'],
                        ],
                        'periode' => ['name' => 'KKN Reguler 2026'],
                    ],
                    [
                        'id' => 900002,
                        'status' => 'approved',
                        'mahasiswa' => [
                            'nim' => '2310401042',
                            'user' => ['name' => 'Muhammad Alif Pratama'],
                        ],
                        'periode' => ['name' => 'KKN Reguler 2026'],
                    ],
                    [
                        'id' => 900003,
                        'status' => 'approved',
                        'mahasiswa' => [
                            'nim' => '2310401098',
                            'user' => ['name' => 'Nabila Khairunnisa'],
                        ],
                        'periode' => ['name' => 'KKN Tematik Desa 2026'],
                    ],
                ],
            ],
            'stats' => Inertia::defer(function () use ($periodId, $facultyId) {
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

                $statistics = $this->statsService->getPeriodStatistics($periodId, $facultyId);
                $periodData = $this->contextService->getActivePeriodData();

                return array_merge(
                    $statistics['summary'],
                    ['active_period' => $periodData['name'] ?? '-']
                );
            }),
            'sdg_distribution' => Inertia::defer(function () use ($periodId, $facultyId) {
                if (!$periodId) {
                    return [];
                }
                $statistics = $this->statsService->getPeriodStatistics($periodId, $facultyId);
                return $statistics['sdg_distribution'];
            }),
            'recentRegistrations' => Inertia::defer(function () use ($periodId, $facultyId) {
                if (!$periodId) {
                    return [];
                }
                $query = \App\Models\KKN\PesertaKkn::with(['mahasiswa.user', 'periode'])
                    ->where('period_id', $periodId);

                if ($facultyId) {
                    $query->whereHas('mahasiswa', fn($q) => $q->where('faculty_id', $facultyId));
                }

                return $query->latest()
                    ->take(5)
                    ->get();
            }),
        ]);
    }
}
