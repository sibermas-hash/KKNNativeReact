<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\Periode;
use App\Services\DashboardStatisticsService;
use App\Services\GroupSelectionService;
use App\Services\KKN\IntelligenceService;
use App\Services\PeriodContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardStatisticsService $statsService,
        private PeriodContextService $contextService,
        private IntelligenceService $intelligenceService,
    ) {}

    public function index(Request $request): Response
    {
        Gate::authorize('access-admin-panel');

        // Fetch active periods for the switcher
        $activePeriods = Periode::where('is_active', true)->latest()->get();

        // Get selected period from request or default to the primary active one
        $periodId = $request->query('period_id') ?? ($this->contextService->getActivePeriodId() ?? $this->contextService->getDefaultPeriodId());
        $periodData = $periodId ? Periode::find($periodId) : $this->contextService->getActivePeriodData();

        $period = null;
        if ($periodId) {
            $period = Periode::find($periodId);
        }

        $currentPhase = null;
        if ($period) {
            $phaseLabels = [
                'upcoming' => ['key' => 'upcoming', 'label' => 'Pra-Pendaftaran', 'color' => 'slate'],
                'registration' => ['key' => 'registration', 'label' => 'Masa Pendaftaran', 'color' => 'emerald'],
                'placement' => ['key' => 'placement', 'label' => 'Seleksi & Plotting', 'color' => 'blue'],
                'execution' => ['key' => 'execution', 'label' => 'Terjun Lapangan', 'color' => 'purple'],
                'grading' => ['key' => 'grading', 'label' => 'Masa Penilaian', 'color' => 'amber'],
                'finished' => ['key' => 'finished', 'label' => 'Selesai', 'color' => 'slate'],
            ];

            $currentPhase = $phaseLabels[$period->current_phase] ?? $phaseLabels['upcoming'];
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

                $facultyId = $user?->hasRole('faculty_admin') ? $user?->faculty_id : null;
                $statistics = $this->statsService->getPeriodStatistics($periodId, $facultyId);

                return array_merge(
                    $statistics['summary'],
                    ['active_period' => $periodData instanceof Periode ? ($periodData->name ?? $periodData->periode ?? '-') : ($periodData['name'] ?? $periodData['periode'] ?? '-')]
                );
            }),
            'sdg_distribution' => Inertia::defer(function () use ($periodId, $user) {
                if (! $periodId) {
                    return [];
                }
                $facultyId = $user?->hasRole('faculty_admin') ? $user?->faculty_id : null;
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
                    ->whereHas('lokasi', fn ($q) => $q->whereNotNull('latitude')->whereNotNull('longitude'));

                return \App\Services\KKN\FacultyScopeService::apply($query, 'peserta.mahasiswa.faculty_id')
                    ->get()
                    ->map(fn ($group) => [
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

                $query = KegiatanKkn::query()
                    ->where('date', '>=', now()->subDays(14));

                $trends = \App\Services\KKN\FacultyScopeService::apply($query, 'mahasiswa.faculty_id')
                    ->select(DB::raw('date as date'), DB::raw('count(*) as count'))
                    ->groupBy('date')
                    ->get()
                    ->pluck('count', 'date');

                return $days->map(fn ($date) => [
                    'date' => $date,
                    'count' => $trends->get($date, 0),
                ])->values();
            }),
            'intelligence' => Inertia::defer(function () use ($user) {
                $facultyId = $user?->hasRole('faculty_admin') ? $user?->faculty_id : null;
                $anomalies = $this->intelligenceService->getHighRiskAnomalies($facultyId);

                return [
                    'high_risk_count' => $anomalies->count(),
                    'anomalies' => $anomalies->take(5),
                ];
            }),
            'current_phase' => $currentPhase,
            'active_period_id' => (int) $periodId,
            'active_period_name' => $periodData instanceof Periode ? ($periodData->name ?? $periodData->periode ?? '-') : ($periodData['name'] ?? $periodData['periode'] ?? '-'),
            'active_periods' => $activePeriods->map(fn ($p) => [
                'id' => $p->id,
                'nama' => $p->name ?? $p->nama ?? $p->periode ?? '-',
            ]),
            'phase_context' => Inertia::defer(function () use ($periodId, $period, $user) {
                if (! $period || ! $periodId) {
                    return ['hint' => 'Tidak ada periode aktif.'];
                }

                $facultyId = $user?->hasRole('faculty_admin')
                    ? $user?->faculty_id
                    : null;
                $phase = $period->current_phase ?? 'upcoming';

                return match ($phase) {
                    'upcoming' => [
                        'hint' => 'Periode siap dimulai. Klik "Buka Pendaftaran" untuk membuka portal mahasiswa.',
                        'actions' => [
                            ['label' => 'Kelola Persyaratan', 'href' => '/admin/kkn-requirements', 'color' => 'emerald'],
                            ['label' => 'Cek Lokasi KKN', 'href' => '/admin/lokasi', 'color' => 'blue'],
                        ],
                    ],
                    'registration' => $this->registrationContext($periodId, $facultyId),
                    'placement' => $this->placementContext($periodId, $facultyId),
                    'execution' => $this->executionContext($periodId, $facultyId),
                    'grading' => $this->gradingContext($periodId, $facultyId),
                    'finished' => [
                        'hint' => 'KKN periode ini telah selesai. Data sudah terkunci.',
                        'actions' => [
                            ['label' => 'Rekap Nilai Akhir', 'href' => '/admin/grade-reports', 'color' => 'emerald'],
                            ['label' => 'Ekspor Data', 'href' => '/admin/pendaftaran', 'color' => 'blue'],
                        ],
                    ],
                    default => ['hint' => 'Fase tidak dikenali.'],
                };
            }),
        ]);
    }

    private function calculateCurrentPhase(Periode $period): array
    {
        $now = now();

        if ($period->registration_start?->isFuture()) {
            return ['key' => 'upcoming', 'label' => 'Pra-Pendaftaran', 'color' => 'slate'];
        }

        if ($period->registration_start?->isPast() && $period->registration_end?->isFuture()) {
            return ['key' => 'registration', 'label' => 'Masa Pendaftaran', 'color' => 'emerald'];
        }

        if ($period->registration_end?->isPast() && $period->start_date?->isFuture()) {
            return ['key' => 'placement', 'label' => 'Seleksi & Plotting', 'color' => 'blue'];
        }

        if ($period->start_date?->isPast() && $period->end_date?->isFuture()) {
            return ['key' => 'execution', 'label' => 'Terjun Lapangan', 'color' => 'purple'];
        }

        if ($period->end_date?->isPast() && ($period->grading_end?->isFuture() ?? true)) {
            return ['key' => 'grading', 'label' => 'Masa Penilaian', 'color' => 'amber'];
        }

        return ['key' => 'finished', 'label' => 'Selesai', 'color' => 'slate'];
    }

    public function switchPhase(Request $request): RedirectResponse
    {
        Gate::authorize('manage-master-data');

        $request->validate([
            'target' => 'required|string|in:upcoming,registration,placement,execution,grading,finished',
            'period_id' => 'required|exists:periode,id',
        ]);

        $period = Periode::findOrFail($request->period_id);
        $now = now()->startOfDay();

        $updateData = ['current_phase' => $request->target];

        switch ($request->target) {
            case 'upcoming':
                $updateData = array_merge($updateData, [
                    'registration_start' => $now->copy()->addDays(7),
                    'registration_end' => $now->copy()->addDays(14),
                    'start_date' => $now->copy()->addDays(21),
                    'end_date' => $now->copy()->addDays(61),
                ]);
                break;
            case 'registration':
                $updateData = array_merge($updateData, [
                    'registration_start' => $now,
                    'registration_end' => $now->copy()->addDays(7),
                ]);
                break;
            case 'placement':
                $updateData = array_merge($updateData, [
                    'registration_end' => $now->copy()->subDay(),
                    'start_date' => $now->copy()->addDays(3),
                ]);
                break;
            case 'execution':
                $updateData = array_merge($updateData, [
                    'registration_end' => $now->copy()->subDays(7),
                    'start_date' => $now,
                    'end_date' => $now->copy()->addDays(40),
                ]);
                break;
            case 'grading':
                $updateData = array_merge($updateData, [
                    'end_date' => $now->copy()->subDay(),
                    'grading_start' => $now,
                    'grading_end' => $now->copy()->addDays(14),
                ]);
                break;
            case 'finished':
                $updateData = array_merge($updateData, [
                    'grading_end' => $now,
                ]);
                break;
        }

        $period->update($updateData);
        \App\Services\RedisCacheService::invalidateMasterData();

        return back()->with('success', 'Fase berhasil dipindahkan ke: '.$request->target);
    }

    // ── Phase Context Helpers ─────────────────────────────────────────

    private function registrationContext(int $periodId, ?int $facultyId): array
    {
        $query = \App\Models\KKN\PesertaKkn::where('period_id', $periodId);
        if ($facultyId) {
            $query->whereHas('mahasiswa', fn ($q) => $q->where('faculty_id', $facultyId));
        }

        $total = (clone $query)->count();
        $pending = (clone $query)->where('status', 'pending')->count();
        $approved = (clone $query)->where('status', 'approved')->count();

        return [
            'hint' => 'Pendaftaran sedang berjalan. Pantau dan setujui pendaftar baru.',
            'counters' => [
                ['label' => 'Total Pendaftar', 'value' => $total, 'color' => 'emerald'],
                ['label' => 'Menunggu Verifikasi', 'value' => $pending, 'color' => 'amber'],
                ['label' => 'Disetujui', 'value' => $approved, 'color' => 'blue'],
            ],
            'actions' => [
                ['label' => 'Kelola Pendaftaran', 'href' => '/admin/pendaftaran', 'color' => 'emerald'],
                ['label' => 'Setujui Massal', 'href' => '/admin/pendaftaran', 'color' => 'blue'],
            ],
        ];
    }

    private function placementContext(int $periodId, ?int $facultyId): array
    {
        $query = \App\Models\KKN\PesertaKkn::where('period_id', $periodId)
            ->where('status', 'approved');
        if ($facultyId) {
            $query->whereHas('mahasiswa', fn ($q) => $q->where('faculty_id', $facultyId));
        }

        $approved = (clone $query)->count();
        $assigned = (clone $query)->whereNotNull('kelompok_id')->count();
        $totalGroups = \App\Models\KKN\KelompokKkn::where('period_id', $periodId)->count();
        
        $unassigned = $approved - $assigned;

        return [
            'hint' => 'Plotting sedang berlangsung. Tugaskan mahasiswa ke kelompok.',
            'counters' => [
                ['label' => 'Mahasiswa Disetujui', 'value' => $approved, 'color' => 'emerald'],
                ['label' => 'Sudah Ditugaskan', 'value' => $assigned, 'color' => 'blue'],
                ['label' => 'Belum Ditugaskan', 'value' => $unassigned, 'color' => 'amber'],
                ['label' => 'Jumlah Kelompok', 'value' => $totalGroups, 'color' => 'slate'],
            ],
            'actions' => [
                ['label' => 'Kelola Kelompok', 'href' => '/admin/kelompok', 'color' => 'emerald'],
                ['label' => 'Penugasan DPL', 'href' => '/admin/dosen/penugasan', 'color' => 'blue'],
            ],
        ];
    }

    private function executionContext(int $periodId, ?int $facultyId): array
    {
        $today = now()->format('Y-m-d');

        $queryReports = KegiatanKkn::where('date', $today);
        if ($facultyId) {
            $queryReports = \App\Services\KKN\FacultyScopeService::apply($queryReports, 'mahasiswa.faculty_id');
        }
        $todayReports = (clone $queryReports)->count();
        $totalStudents = \App\Models\KKN\PesertaKkn::where('period_id', $periodId)
                ->whereIn('status', ['approved', 'active'])
                ->whereNotNull('kelompok_id')
                ->count();

        return [
            'hint' => 'KKN sedang berlangsung. Pantau aktivitas harian mahasiswa.',
            'counters' => [
                ['label' => 'Laporan Hari Ini', 'value' => $todayReports, 'color' => 'emerald'],
                ['label' => 'Total Peserta Aktif', 'value' => $totalStudents, 'color' => 'blue'],
            ],
            'actions' => [
                ['label' => 'Lihat Log Aktivitas', 'href' => '/admin/laporan/harian', 'color' => 'emerald'],
                ['label' => 'Audit Anomali', 'href' => '/admin/auditor-aktivitas', 'color' => 'amber'],
            ],
        ];
    }

    private function gradingContext(int $periodId, ?int $facultyId): array
    {
        $totalStudents = \App\Models\KKN\PesertaKkn::where('period_id', $periodId)
            ->whereIn('status', ['approved', 'active'])
            ->whereNotNull('kelompok_id')
            ->count();

        // Count students who have been graded via nilai_kkn (joined through kelompok_id)
        $gradedStudents = 0;
        try {
            $groupIds = \App\Models\KKN\KelompokKkn::where('period_id', $periodId)
                ->pluck('id');
            $gradedStudents = DB::connection('kkn')
                ->table('nilai_kkn')
                ->whereIn('kelompok_id', $groupIds)
                ->where('total_score', '>', 0)
                ->count();
        } catch (\Throwable $e) {
            // Table mungkin belum ada data — aman diabaikan
        }

        $ungradedStudents = max(0, $totalStudents - $gradedStudents);

        return [
            'hint' => 'Masa penilaian berjalan. Pantau progress input nilai DPL.',
            'counters' => [
                ['label' => 'Total Peserta', 'value' => $totalStudents, 'color' => 'blue'],
                ['label' => 'Sudah Dinilai', 'value' => $gradedStudents, 'color' => 'emerald'],
                ['label' => 'Belum Dinilai', 'value' => $ungradedStudents, 'color' => 'amber'],
            ],
            'actions' => [
                ['label' => 'Generator Nilai', 'href' => '/admin/generator-nilai', 'color' => 'emerald'],
                ['label' => 'Rekap Nilai', 'href' => '/admin/grade-reports', 'color' => 'blue'],
            ],
        ];
    }
}
