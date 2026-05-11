<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\LaporanAkhirResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\LaporanAkhir;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LaporanAkhirAdminController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = LaporanAkhir::with(['mahasiswa.user', 'kelompok'])->when($request->input('kelompok_id'), fn ($q, $id) => $q->where('kelompok_id', $id))->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))->orderByDesc('submitted_at');

        return $this->successCollection(LaporanAkhirResource::collection($query->paginate(25)));
    }

    public function show(LaporanAkhir $report): JsonResponse
    {
        $report->load(['mahasiswa.user', 'kelompok']);

        return $this->success(new LaporanAkhirResource($report));
    }

    public function updateStatus(Request $request, LaporanAkhir $report): JsonResponse
    {
        $request->validate(['status' => ['required', 'string', 'in:approved,revision'], 'review_notes' => ['nullable', 'string']]);
        $report->update(['status' => $request->input('status'), 'reviewed_by' => auth()->id(), 'reviewed_at' => now(), 'review_notes' => $request->input('review_notes')]);

        return $this->success(new LaporanAkhirResource($report->refresh()), 'Status laporan diperbarui.');
    }

    public function download(Request $request, LaporanAkhir $report)
    {
        $asset = $request->input('asset');
        $allowedPaths = collect([
            $report->file_path,
            $report->article_1_path,
            $report->article_2_path,
            $report->poster_1_path,
            $report->poster_2_path,
            $report->poster_3_path,
        ])->filter()->values();

        $path = $asset && $allowedPaths->contains($asset) ? $asset : $report->file_path;

        abort_if(! $path || ! Storage::exists($path), 404, 'File laporan tidak ditemukan.');

        return Storage::download($path, basename($path));
    }
}
