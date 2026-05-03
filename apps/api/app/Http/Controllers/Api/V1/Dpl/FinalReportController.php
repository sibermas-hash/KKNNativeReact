<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Dpl;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\LaporanAkhirResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\LaporanAkhir;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinalReportController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $dosen = auth()->user()->dosen;
        if (! $dosen) {
            return $this->success(['reports' => []]);
        }

        $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');

        $reports = LaporanAkhir::whereIn('kelompok_id', $groupIds)
            ->with(['mahasiswa.user', 'kelompok'])
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('submitted_at')
            ->paginate($request->input('per_page', 25));

        return $this->successCollection(LaporanAkhirResource::collection($reports));
    }

    public function show(LaporanAkhir $report): JsonResponse
    {
        $report->load(['mahasiswa.user', 'kelompok']);

        return $this->success(new LaporanAkhirResource($report));
    }

    public function approve(Request $request, LaporanAkhir $report): JsonResponse
    {
        $request->validate(['score' => ['nullable', 'numeric', 'min:0', 'max:100']]);

        $report->update([
            'status' => LaporanAkhir::STATUS_APPROVED,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
            'score' => $request->input('score'),
        ]);

        return $this->success(
            new LaporanAkhirResource($report->refresh()),
            'Laporan akhir disetujui.'
        );
    }

    public function revision(Request $request, LaporanAkhir $report): JsonResponse
    {
        $request->validate(['review_notes' => ['required', 'string', 'max:2000']]);

        $report->update([
            'status' => LaporanAkhir::STATUS_REVISION,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
            'review_notes' => $request->input('review_notes'),
        ]);

        return $this->success(
            new LaporanAkhirResource($report->refresh()),
            'Revisi laporan akhir diminta.'
        );
    }
}
