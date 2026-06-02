<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\PeriodeResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Services\DashboardStatisticsService;
use App\Services\PeriodContextService;
use App\Services\RedisCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    use ApiResponse;

    public function hub(): JsonResponse
    {
        $user = auth()->user();

        $quickLinks = [
            ['label' => 'Dashboard', 'route' => 'admin.dashboard'],
            ['label' => 'Konten Publik', 'route' => 'admin.konten-publik'],
        ];

        // Admin gets operational KKN links but NOT system settings
        if ($user->hasAnyRole(['superadmin', 'admin'])) {
            $quickLinks = array_merge($quickLinks, [
                ['label' => 'Pendaftaran', 'route' => 'admin.pendaftaran.index'],
                ['label' => 'Kelompok', 'route' => 'admin.kelompok.index'],
                ['label' => 'Laporan Harian', 'route' => 'admin.laporan.harian.index'],
                ['label' => 'Rekap Nilai', 'route' => 'admin.grade-reports.index'],
            ]);
        }

        // Only superadmin sees system-level links
        if ($user->hasRole('superadmin')) {
            $quickLinks[] = ['label' => 'Pengaturan Sistem', 'route' => 'admin.pengaturan.sistem'];
            $quickLinks[] = ['label' => 'Monitoring', 'route' => 'admin.monitoring'];
            $quickLinks[] = ['label' => 'Database Sync', 'route' => 'admin.database-sync'];
            $quickLinks[] = ['label' => 'Pengguna', 'route' => 'admin.pengguna'];
        }

        return $this->success([
            'user' => [
                'name' => $user->name,
                'roles' => $user->getRoleNames()->toArray(),
            ],
            'quick_links' => $quickLinks,
        ]);
    }

    public function index(Request $request, PeriodContextService $periodContextService): JsonResponse
    {
        $periodId = $request->integer('periode_id')
            ?? $periodContextService->getActivePeriodId()
            ?? $periodContextService->getDefaultPeriodId();

        if (! $periodId) {
            return $this->success([
                'stats' => null,
                'weekly_trend' => [],
                'period' => null,
                'phase_context' => ['hint' => 'Tidak ada periode aktif.'],
            ]);
        }

        $periodId = (int) $periodId;
        $period = Periode::with(['tahunAkademik', 'jenisKkn'])->find($periodId);

        if (! $period) {
            return $this->success([
                'stats' => null,
                'weekly_trend' => [],
                'period' => null,
                'current_phase' => 'upcoming',
                'phase_context' => ['hint' => 'Periode tidak ditemukan.'],
                'available_periods' => $periodContextService->getAvailablePeriods(),
            ]);
        }

        $facultyId = auth()->user()?->hasRole('faculty_admin') ? auth()->user()?->fakultas_id : null;
        $service = app(DashboardStatisticsService::class);
        try {
            $stats = $service->getPeriodStatistics($periodId, $facultyId);
            $weeklyTrend = $service->getWeeklyTrend($periodId);
            $phaseContext = $this->getPhaseContext($period, $periodId);
        } catch (\Throwable $e) {
            report($e);
            Log::warning('Dashboard fallback used', [
                'periode_id' => $periodId,
                'faculty_id' => $facultyId,
                'error' => $e->getMessage(),
            ]);

            $stats = [
                'summary' => ['total_students' => 0, 'total_groups' => 0],
                'students_by_status' => [],
                'grade_distribution' => [],
                'dpl_workload' => [],
                'sdg_distribution' => [],
                'degraded' => true,
            ];
            $weeklyTrend = [];
            $phaseContext = ['hint' => 'Dashboard sementara mode aman. Cek log server.'];
        }

        return $this->success([
            'stats' => $stats,
            'weekly_trend' => $weeklyTrend,
            'period' => new PeriodeResource($period),
            'current_phase' => $period->current_phase ?? 'upcoming',
            'phase_context' => $phaseContext,
            'available_periods' => $periodContextService->getAvailablePeriods(),
        ]);
    }

    private function getPhaseContext(?object $period, int $periodId): array
    {
        if (! $period) {
            return ['hint' => 'Periode tidak ditemukan.'];
        }

        $user = auth()->user();
        $facultyId = $user?->hasRole('faculty_admin') ? $user->fakultas_id : null;
        $phase = $period->current_phase ?? 'upcoming';

        $cacheKey = "phase_context_{$periodId}_{$phase}_".($facultyId ?? 'all');

        return Cache::remember($cacheKey, 300, function () use ($phase, $periodId, $facultyId) {
            return match ($phase) {
                'upcoming' => [
                    'hint' => 'Periode siap dimulai. Klik "Buka Pendaftaran" untuk membuka portal mahasiswa.',
                    'actions' => [
                        ['label' => 'Kelola Persyaratan', 'route' => 'admin.kkn-requirements.index', 'color' => 'emerald'],
                        ['label' => 'Cek Lokasi KKN', 'route' => 'admin.lokasi.index', 'color' => 'blue'],
                    ],
                ],
                'registration' => $this->registrationContext($periodId, $facultyId),
                'placement' => $this->placementContext($periodId, $facultyId),
                'execution', 'implementation' => $this->executionContext($periodId, $facultyId),
                'grading' => $this->gradingContext($periodId, $facultyId),
                'finished' => [
                    'hint' => 'KKN periode ini telah selesai. Data sudah terkunci.',
                    'actions' => [
                        ['label' => 'Rekap Nilai Akhir', 'route' => 'admin.grade-reports.index', 'color' => 'emerald'],
                        ['label' => 'Ekspor Data', 'route' => 'admin.pendaftaran.index', 'color' => 'blue'],
                    ],
                ],
                default => ['hint' => 'Fase tidak dikenali.'],
            };
        });
    }

    private function registrationContext(int $periodId, ?int $facultyId): array
    {
        $query = PesertaKkn::where('periode_id', $periodId);
        if ($facultyId) {
            $query->whereHas('mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
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
                ['label' => 'Kelola Pendaftaran', 'route' => 'admin.pendaftaran.index', 'color' => 'emerald'],
                ['label' => 'Setujui Massal', 'route' => 'admin.pendaftaran.index', 'color' => 'blue'],
            ],
        ];
    }

    private function placementContext(int $periodId, ?int $facultyId): array
    {
        $query = PesertaKkn::where('periode_id', $periodId)->where('status', 'approved');
        if ($facultyId) {
            $query->whereHas('mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
        }

        $approved = (clone $query)->count();
        $assigned = (clone $query)->whereNotNull('kelompok_id')->count();
        $totalGroups = KelompokKkn::where('periode_id', $periodId)->count();
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
                ['label' => 'Kelola Kelompok', 'route' => 'admin.kelompok.index', 'color' => 'emerald'],
                ['label' => 'Penugasan DPL', 'route' => 'admin.dosen.penugasan.index', 'color' => 'blue'],
            ],
        ];
    }

    private function executionContext(int $periodId, ?int $facultyId): array
    {
        $today = now()->format('Y-m-d');
        $queryReports = KegiatanKkn::where('date', $today)
            ->whereIn('kelompok_id', function ($sub) use ($periodId) {
                $sub->select('id')->from('kelompok_kkn')->where('periode_id', $periodId);
            });
        if ($facultyId) {
            $queryReports->whereHas('mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
        }
        $todayReports = (clone $queryReports)->count();

        $totalStudents = PesertaKkn::where('periode_id', $periodId)
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
                ['label' => 'Lihat Log Aktivitas', 'route' => 'admin.laporan.harian.index', 'color' => 'emerald'],
                ['label' => 'Audit Anomali', 'route' => 'admin.auditor-aktivitas.index', 'color' => 'amber'],
            ],
        ];
    }

    private function gradingContext(int $periodId, ?int $facultyId): array
    {
        $totalStudents = PesertaKkn::where('periode_id', $periodId)
            ->whereIn('status', ['approved', 'active'])
            ->whereNotNull('kelompok_id')
            ->count();

        // Subquery: avoid pluck+whereIn round-trip
        $gradedStudents = NilaiKkn::whereHas(
            'kelompok', fn ($q) => $q->where('periode_id', $periodId)
        )
            ->where('total_score', '>', 0)
            ->count();
        $ungradedStudents = max(0, $totalStudents - $gradedStudents);

        return [
            'hint' => 'Masa penilaian berjalan. Pantau progress input nilai DPL.',
            'counters' => [
                ['label' => 'Total Peserta', 'value' => $totalStudents, 'color' => 'blue'],
                ['label' => 'Sudah Dinilai', 'value' => $gradedStudents, 'color' => 'emerald'],
                ['label' => 'Belum Dinilai', 'value' => $ungradedStudents, 'color' => 'amber'],
            ],
            'actions' => [
                ['label' => 'Generator Nilai', 'route' => 'admin.generator-nilai.index', 'color' => 'emerald'],
                ['label' => 'Rekap Nilai', 'route' => 'admin.grade-reports.index', 'color' => 'blue'],
            ],
        ];
    }

    public function switchPhase(Request $request): JsonResponse
    {
        $request->validate([
            'periode_id' => ['required', 'exists:periode,id'],
            'phase' => ['required', 'string', 'in:upcoming,registration,placement,execution,grading,finished'],
        ]);

        $periodId = (int) $request->input('periode_id');
        $phase = $request->input('phase');

        // State machine: define valid transitions
        $validTransitions = [
            'upcoming' => ['registration'],
            'registration' => ['placement', 'upcoming'],
            'placement' => ['execution', 'registration'],
            'execution' => ['grading', 'placement'],
            'grading' => ['finished', 'execution'],
            'finished' => [],
        ];

        $period = Periode::findOrFail($periodId);
        $currentPhase = $period->current_phase ?? 'upcoming';

        // Superadmin can bypass state machine; admin must follow it
        if (! auth()->user()->hasRole('superadmin')) {
            $allowed = $validTransitions[$currentPhase] ?? [];
            if (! in_array($phase, $allowed, true)) {
                return $this->error(
                    'INVALID_TRANSITION',
                    "Transisi fase dari '{$currentPhase}' ke '{$phase}' tidak diizinkan.",
                    422
                );
            }
        }

        $period->update(['current_phase' => $phase]);

        Log::info('Phase switched', [
            'periode_id' => $periodId,
            'from' => $currentPhase,
            'to' => $phase,
            'by' => auth()->id(),
        ]);

        // Clear cache
        app(PeriodContextService::class)->clear();
        RedisCacheService::invalidateMasterData();

        return $this->success(
            new PeriodeResource($period->refresh()),
            "Fase berhasil diubah ke {$phase}."
        );
    }

    private function calculateCurrentPhase(Periode $period): array
    {
        $phaseLabels = [
            'upcoming' => ['key' => 'upcoming', 'label' => 'Pra-Pendaftaran', 'color' => 'slate'],
            'registration' => ['key' => 'registration', 'label' => 'Masa Pendaftaran', 'color' => 'emerald'],
            'placement' => ['key' => 'placement', 'label' => 'Seleksi & Plotting', 'color' => 'blue'],
            'execution' => ['key' => 'execution', 'label' => 'Terjun Lapangan', 'color' => 'purple'],
            'implementation' => ['key' => 'implementation', 'label' => 'Masa Pelaksanaan', 'color' => 'purple'],
            'grading' => ['key' => 'grading', 'label' => 'Masa Penilaian', 'color' => 'amber'],
            'finished' => ['key' => 'finished', 'label' => 'Selesai', 'color' => 'slate'],
        ];

        // Prioritize explicit database override
        if ($period->current_phase && isset($phaseLabels[$period->current_phase])) {
            return $phaseLabels[$period->current_phase];
        }

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
}
