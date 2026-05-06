<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\PesertaKkn;
use App\Services\StudentTransferService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentTransferController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly StudentTransferService $transferService
    ) {}

    public function transfer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'peserta_kkn_id'     => ['required', 'exists:peserta_kkn,id'],
            'target_periode_id'  => ['required', 'exists:periode,id'],
            'target_kelompok_id' => ['nullable', 'exists:kelompok_kkn,id'],
            'reason'             => ['required', 'string', 'max:1000'],
        ]);

        $history = $this->transferService->transferStudent(
            pesertaKknId: $validated['peserta_kkn_id'],
            targetPeriodId: $validated['target_periode_id'],
            targetGroupId: $validated['target_kelompok_id'] ?? null,
            reason: $validated['reason'],
            processedBy: auth()->id(),
        );

        return $this->success(['history_id' => $history->id], 'Mahasiswa berhasil dipindahkan.');
    }

    public function getTransferTargets(Request $request): JsonResponse
    {
        $pesertaId = $request->input('peserta_kkn_id');
        $periodeId = $request->input('periode_id');

        if ($pesertaId) {
            $peserta   = PesertaKkn::with('kelompok')->findOrFail($pesertaId);
            $periodeId = $peserta->kelompok?->periode_id;
            $currentGroupId = $peserta->kelompok_id;
        }

        $groups = KelompokKkn::when($periodeId, fn ($q) => $q->where('periode_id', $periodeId))
            ->when(isset($currentGroupId), fn ($q) => $q->where('id', '!=', $currentGroupId))
            ->withCount('peserta')
            ->get(['id', 'nama_kelompok', 'code', 'capacity']);

        return $this->success($groups->map(fn ($g) => [
            'id'             => $g->id,
            'nama_kelompok'  => $g->nama_kelompok,
            'code'           => $g->code,
            'capacity'       => $g->capacity,
            'member_count'   => $g->peserta_count,
            'available_slots' => $g->capacity ? max(0, $g->capacity - $g->peserta_count) : null,
        ]));
    }
}
