<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\DashboardStatisticsService;
use App\Services\GroupSelectionService;
use App\Services\PeriodContextService;
use App\Models\KKN\Laporan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
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
        Gate::authorize('access-admin-panel');

        $periodId = $this->contextService->getActivePeriodId() ?? $this->contextService->getDefaultPeriodId();
        $periodData = $this->contextService->getActivePeriodData();

        if (! $periodData && $periodId) {
            $period = \App\Models\KKN\Periode::query()->find($periodId);

            $periodData = $period ? [
                'id' => $period->id,
                'name' => $period->name,
                'periode' => $period->periode,
                'jenis' => $period->jenis,
                'is_active' => $period->is_active,
            ] : null;
        }

        $user = auth()->user();
        $isFacultyAdmin = $user?->hasRole('faculty_admin');

        return Inertia::render('Admin/Dashboard', [
            'stats' => Inertia::defer(function () use ($periodId, $periodData, $user) {
                if (! $periodId) {
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

                $facultyId = ($user?->hasRole('faculty_admin') || $user?->hasRole('admin_fakultas')) ? $user?->faculty_id : null;
                $statistics = $this->statsService->getPeriodStatistics($periodId, $facultyId);

                return array_merge(
                    $statistics['summary'],
                    ['active_period' => $periodData['name'] ?? '-']
                );
            }),
            'sdg_distribution' => Inertia::defer(function () use ($periodId, $user) {
                if (! $periodId) {
                    return [];
                }
                $facultyId = ($user?->hasRole('faculty_admin') || $user?->hasRole('admin_fakultas')) ? $user?->faculty_id : null;
                $statistics = $this->statsService->getPeriodStatistics($periodId, $facultyId);
                return $statistics['sdg_distribution'];
            }),
            'recentRegistrations' => Inertia::defer(function () use ($periodId) {
                if (! $periodId) {
                    return [];
                }
                $query = \App\Models\KKN\PesertaKkn::with(['mahasiswa.user', 'periode'])
                    ->where('period_id', $periodId);

                return \App\Services\KKN\FacultyScopeService::apply($query, 'mahasiswa.faculty_id')
                    ->latest('registration_date')
                    ->take(5)
                    ->get();
            }),
            'gis_locations' => Inertia::defer(function () use ($periodId) {
                if (! $periodId) {
                    return [];
                }
                
                $query = \App\Models\KKN\KelompokKkn::query()
                    ->where('period_id', $periodId)
                    ->with('lokasi')
                    ->withCount([
                        'peserta as peserta_count' => fn ($q) => $q
                            ->whereIn('status', GroupSelectionService::activeRegistrationStatuses()),
                    ])
                    ->whereHas('lokasi', fn($q) => $q->whereNotNull('latitude')->whereNotNull('longitude'));

                return \App\Services\KKN\FacultyScopeService::apply($query, 'peserta.mahasiswa.faculty_id')
                    ->get()
                    ->map(fn($group) => [
                        'id' => $group->id,
                        'name' => $group->nama_kelompok,
                        'lat' => (float) $group->lokasi->latitude,
                        'lng' => (float) $group->lokasi->longitude,
                        'members_count' => $group->peserta_count ?? 0,
                        'village' => $group->lokasi->village_name,
                    ]);
            }),
            'ui' => [
                'is_faculty_admin' => $isFacultyAdmin,
                'can_manage_public_content' => $user?->hasAnyRole(['superadmin', 'admin']) ?? false,
            ],
            'activity_trend' => Inertia::defer(function () {
                $days = collect(range(0, 13))->map(fn ($i) => now()->subDays($i)->format('Y-m-d'))->reverse();
                
                $query = Laporan::query()
                    ->where('submitted_at', '>=', now()->subDays(14));

                $trends = \App\Services\KKN\FacultyScopeService::apply($query, 'kelompok.peserta.mahasiswa.faculty_id')
                    ->select(DB::raw("DATE(submitted_at) as date"), DB::raw('count(*) as count'))
                    ->groupBy('date')
                    ->get()
                    ->pluck('count', 'date');

                return $days->map(fn ($date) => [
                    'date' => $date,
                    'count' => $trends->get($date, 0),
                ])->values();
            }),
            'intelligence' => Inertia::defer(function () {
                $query = Laporan::where('status', 'submitted')
                    ->whereRaw('LENGTH(description) < 30');

                return [
                    'high_risk_count' => \App\Services\KKN\FacultyScopeService::apply($query, 'kelompok.peserta.mahasiswa.faculty_id')
                        ->count(),
                ];
            }),
        ]);
    }
}
