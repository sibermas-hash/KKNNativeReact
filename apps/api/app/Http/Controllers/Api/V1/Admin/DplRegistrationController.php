<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Dosen;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\Periode;
use App\Services\DplAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class DplRegistrationController extends Controller
{
    public function __construct(
        private readonly DplAssignmentService $assignmentService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('manageDplAssignment');

        $query = DplPeriod::with(['dosen.user', 'dosen.fakultas', 'periode'])
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('periode_id'), fn ($q, $id) => $q->where('periode_id', $id))
            ->when($request->input('search'), function ($q, $search) {
                // nip encrypted — partial ilike impossible; nama-only + exact bidx.
                $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $search);
                $q->whereHas('dosen', function ($dq) use ($escaped, $search) {
                    $dq->where('nama', 'ilike', "%{$escaped}%");
                    if (preg_match('/^\d{6,20}$/', trim($search))) {
                        $dq->orWhere('nip_bidx', \App\Models\KKN\Dosen::computeBlindIndex(trim($search)));
                    }
                });
            })
            ->orderByDesc('created_at');

        $total = $query->count();
        $pending = (clone $query)->where('status', 'pending')->count();
        $approved = (clone $query)->where('status', 'approved')->count();
        $rejected = (clone $query)->where('status', 'rejected')->count();

        return $this->success([
            'registrations' => $query->paginate($request->input('per_page', 25))->items(),
            'stats' => [
                'total' => $total,
                'pending' => $pending,
                'approved' => $approved,
                'rejected' => $rejected,
            ],
        ]);
    }

    public function approve(Request $request, DplPeriod $dplPeriod): JsonResponse
    {
        Gate::authorize('manageDplAssignment');

        $validated = $request->validate([
            'max_kelompok_kkn' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        $dosen = $dplPeriod->dosen;
        $periode = $dplPeriod->periode;

        if (! $dosen || ! $periode) {
            return $this->error('VALIDATION_ERROR', 'Data dosen atau periode tidak ditemukan.', 422);
        }

        try {
            $result = $this->assignmentService->activateForPeriod(
                $dosen,
                $periode,
                $validated['max_kelompok_kkn'] ?? $dplPeriod->max_kelompok_kkn ?? 5
            );

            $dplPeriod->refresh();

            return $this->success([
                'registration' => $dplPeriod->load(['dosen.user', 'dosen.fakultas', 'periode']),
                'provisioning' => $result['provisioning'],
            ], 'Pendaftaran DPL disetujui dan akun DPL diaktifkan.');
        } catch (\DomainException $e) {
            return $this->error('VALIDATION_ERROR', $e->getMessage(), 422);
        }
    }

    public function reject(Request $request, DplPeriod $dplPeriod): JsonResponse
    {
        Gate::authorize('manageDplAssignment');

        $request->validate(['rejection_reason' => ['required', 'string', 'max:500']]);

        $dplPeriod->update([
            'status' => 'rejected',
            'rejection_reason' => $request->input('rejection_reason'),
            'is_active' => false,
        ]);

        return $this->noContent('Pendaftaran DPL ditolak.');
    }

    public function bulkApprove(Request $request): JsonResponse
    {
        Gate::authorize('manageDplAssignment');

        $request->validate([
            'ids' => ['required', 'array', 'max:50'],
            'ids.*' => ['integer'],
            'max_kelompok_kkn' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        $approved = 0;
        $errors = [];

        foreach ($request->input('ids') as $id) {
            try {
                $dplPeriod = DplPeriod::find($id);
                if (! $dplPeriod || $dplPeriod->status !== 'pending') {
                    continue;
                }

                $dosen = $dplPeriod->dosen;
                $periode = $dplPeriod->periode;

                if (! $dosen || ! $periode) {
                    $errors[] = "ID {$id}: Data dosen/periode tidak ditemukan.";
                    continue;
                }

                $this->assignmentService->activateForPeriod(
                    $dosen,
                    $periode,
                    $request->input('max_kelompok_kkn', 5)
                );

                $approved++;
            } catch (\DomainException $e) {
                $errors[] = "ID {$id}: " . $e->getMessage();
            }
        }

        return $this->success([
            'approved_count' => $approved,
            'errors' => $errors,
        ], "{$approved} pendaftaran DPL berhasil disetujui.");
    }

    public function bulkReject(Request $request): JsonResponse
    {
        Gate::authorize('manageDplAssignment');

        $request->validate([
            'ids' => ['required', 'array', 'max:50'],
            'ids.*' => ['integer'],
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        $count = DplPeriod::whereIn('id', $request->input('ids'))
            ->where('status', 'pending')
            ->update([
                'status' => 'rejected',
                'rejection_reason' => $request->input('rejection_reason'),
                'is_active' => false,
            ]);

        return $this->success([
            'rejected_count' => $count,
        ], "{$count} pendaftaran DPL ditolak.");
    }
}
