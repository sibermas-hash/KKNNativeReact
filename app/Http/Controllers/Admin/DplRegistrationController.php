<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\Periode;
use App\Services\DplAssignmentService;
use App\Services\PeriodContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DplRegistrationController extends Controller
{
    public function __construct(
        private DplAssignmentService $assignmentService,
        private PeriodContextService $periodContext,
    ) {}

    /**
     * Halaman daftar pendaftaran DPL (semua status).
     */
    public function index(Request $request): Response
    {
        Gate::authorize('manageDplAssignment');

        $search = trim((string) $request->input('search', ''));
        $statusFilter = $request->input('status', 'all');
        $escapedSearch = str_replace(['%', '_'], ['\\%', '\\_'], $search);
        
        // Contextual period filtering
        $activePeriodId = $request->input('period_id') ?? $this->periodContext->getActivePeriodId();

        $query = DplPeriod::with([
            'dosen:id,nama,nip,is_cpns,is_tugas_belajar',
            'dosen.fakultas:id,nama',
            'periode:id,name,periode,jenis',
        ])
            ->withCount('kelompok')
            ->when($activePeriodId, function ($q) use ($activePeriodId) {
                $q->where('periode_id', $activePeriodId);
            })
            ->when($statusFilter !== 'all', function ($q) use ($statusFilter) {
                $q->where('status', $statusFilter);
            })
            ->when($search !== '', function ($q) use ($escapedSearch) {
                $q->where(function ($builder) use ($escapedSearch) {
                    $builder->whereHas('dosen', function ($dq) use ($escapedSearch) {
                        $dq->where('nama', 'like', "%{$escapedSearch}%")
                            ->orWhere('nip', 'like', "%{$escapedSearch}%");
                    })->orWhereHas('periode', function ($pq) use ($escapedSearch) {
                        $pq->where('name', 'like', "%{$escapedSearch}%");
                    });
                });
            })
            ->orderByRaw(
                'CASE status WHEN ? THEN 1 WHEN ? THEN 2 WHEN ? THEN 3 ELSE 4 END',
                ['pending', 'approved', 'rejected']
            )
            ->orderByDesc('created_at');

        $registrations = $query->paginate(20)->withQueryString();

        // Stats filtered by context
        $stats = [
            'total' => DplPeriod::when($activePeriodId, fn($q) => $q->where('periode_id', $activePeriodId))->count(),
            'pending' => DplPeriod::where('status', 'pending')->when($activePeriodId, fn($q) => $q->where('periode_id', $activePeriodId))->count(),
            'approved' => DplPeriod::where('status', 'approved')->when($activePeriodId, fn($q) => $q->where('periode_id', $activePeriodId))->count(),
            'rejected' => DplPeriod::where('status', 'rejected')->when($activePeriodId, fn($q) => $q->where('periode_id', $activePeriodId))->count(),
        ];

        return Inertia::render('Admin/Operational/Dpl/Registration', [
            'registrations' => $registrations->getCollection()->map(function (DplPeriod $reg) {
                return [
                    'id' => $reg->id,
                    'status' => $reg->status ?? 'pending',
                    'is_active' => (bool) $reg->is_active,
                    'max_kelompok_kkn' => $reg->max_kelompok_kkn,
                    'current_groups' => $reg->kelompok_count,
                    'rejection_reason' => $reg->rejection_reason,
                    'approved_at' => $reg->approved_at?->format('d/m/Y H:i'),
                    'created_at' => $reg->created_at?->format('d/m/Y H:i'),
                    'dosen' => [
                        'id' => $reg->dosen?->id,
                        'nama' => $reg->dosen?->nama ?? '-',
                        'nip' => $reg->dosen?->nip ?? '-',
                        'is_cpns' => (bool) $reg->dosen?->is_cpns,
                        'is_tugas_belajar' => (bool) $reg->dosen?->is_tugas_belajar,
                        'fakultas' => $reg->dosen?->fakultas?->nama ?? '-',
                    ],
                    'periode' => [
                        'id' => $reg->periode?->id,
                        'name' => $reg->periode?->name ?? '-',
                        'jenis' => $reg->periode?->jenis,
                    ],
                ];
            })->values(),
            'pagination' => [
                'current_page' => $registrations->currentPage(),
                'last_page' => $registrations->lastPage(),
                'per_page' => $registrations->perPage(),
                'total' => $registrations->total(),
            ],
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
                'period_id' => $activePeriodId,
            ],
            'periods' => Periode::orderByDesc('is_active')->orderByDesc('periode')->get(['id', 'name', 'periode']),
        ]);
    }

    /**
     * Approve pendaftaran DPL.
     */
    public function approve(Request $request, DplPeriod $registration)
    {
        Gate::authorize('manageDplAssignment');

        $validated = $request->validate([
            'max_kelompok_kkn' => 'nullable|integer|min:1|max:20',
        ]);

        $registration->update([
            'status' => 'approved',
            'is_active' => true,
            'approved_at' => now(),
            'approved_by' => auth()->id(),
            'rejection_reason' => null,
            'max_kelompok_kkn' => $validated['max_kelompok_kkn'] ?? $registration->max_kelompok_kkn ?? 5,
        ]);

        // Assign role DPL ke user
        $user = $registration->dosen?->user;
        if ($user && ! $user->hasRole('dpl')) {
            $user->assignRole('dpl');
        }

        return back()->with('success', "Pendaftaran DPL {$registration->dosen?->nama} berhasil disetujui.");
    }

    /**
     * Reject pendaftaran DPL.
     */
    public function reject(Request $request, DplPeriod $registration)
    {
        Gate::authorize('manageDplAssignment');

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $registration->update([
            'status' => 'rejected',
            'is_active' => false,
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return back()->with('success', "Pendaftaran DPL {$registration->dosen?->nama} ditolak.");
    }

    /**
     * Bulk approve pendaftaran DPL.
     */
    public function bulkApprove(Request $request)
    {
        Gate::authorize('manageDplAssignment');

        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:dpl_periode,id',
            'max_kelompok_kkn' => 'nullable|integer|min:1|max:20',
        ]);

        $maxGroups = $validated['max_kelompok_kkn'] ?? 5;
        $count = 0;

        foreach ($validated['ids'] as $id) {
            $reg = DplPeriod::with('dosen.user')->find($id);
            if ($reg && ($reg->status ?? 'pending') === 'pending') {
                $reg->update([
                    'status' => 'approved',
                    'is_active' => true,
                    'approved_at' => now(),
                    'approved_by' => auth()->id(),
                    'rejection_reason' => null,
                    'max_kelompok_kkn' => $maxGroups,
                ]);

                $user = $reg->dosen?->user;
                if ($user && ! $user->hasRole('dpl')) {
                    $user->assignRole('dpl');
                }

                $count++;
            }
        }

        return back()->with('success', "{$count} pendaftaran DPL berhasil disetujui.");
    }

    /**
     * Bulk reject pendaftaran DPL.
     */
    public function bulkReject(Request $request)
    {
        Gate::authorize('manageDplAssignment');

        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:dpl_periode,id',
            'rejection_reason' => 'required|string|max:500',
        ]);

        $count = 0;

        foreach ($validated['ids'] as $id) {
            $reg = DplPeriod::find($id);
            if ($reg && ($reg->status ?? 'pending') === 'pending') {
                $reg->update([
                    'status' => 'rejected',
                    'is_active' => false,
                    'rejection_reason' => $validated['rejection_reason'],
                ]);
                $count++;
            }
        }

        return back()->with('success', "{$count} pendaftaran DPL ditolak.");
    }
}
