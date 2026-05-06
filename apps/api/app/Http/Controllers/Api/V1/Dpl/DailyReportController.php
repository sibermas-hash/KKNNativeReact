<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Dpl;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\KegiatanKknResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\FileKegiatanKkn;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class DailyReportController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $dosen = auth()->user()->dosen;
        if (! $dosen) {
            return $this->success(['reports' => []]);
        }

        $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');

        $reports = KegiatanKkn::whereIn('kelompok_id', $groupIds)
            ->with(['mahasiswa.user', 'kelompok', 'fileKegiatan'])
            ->when($request->input('status'), fn ($q, $s) => $q->whereIn('status', KegiatanKkn::{"{$s}Statuses"}()))
            ->when($request->input('kelompok_id'), fn ($q, $id) => $q->where('kelompok_id', $id))
            ->when($request->input('date_from'), fn ($q, $d) => $q->where('date', '>=', $d))
            ->when($request->input('date_to'), fn ($q, $d) => $q->where('date', '<=', $d))
            ->orderByDesc('date')
            ->paginate($request->input('per_page', 25));

        return $this->successCollection(KegiatanKknResource::collection($reports));
    }

    public function show(KegiatanKkn $dailyReport): JsonResponse
    {
        Gate::authorize('view', $dailyReport);
        $dailyReport->load(['mahasiswa.user', 'kelompok.lokasi', 'fileKegiatan']);

        return $this->success(new KegiatanKknResource($dailyReport));
    }

    public function approve(KegiatanKkn $dailyReport): JsonResponse
    {
        Gate::authorize('update', $dailyReport);

        $dailyReport->update([
            'status' => KegiatanKkn::STATUS_APPROVED,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return $this->success(
            new KegiatanKknResource($dailyReport->refresh()),
            'Laporan disetujui.'
        );
    }

    public function revision(Request $request, KegiatanKkn $dailyReport): JsonResponse
    {
        Gate::authorize('update', $dailyReport);

        $request->validate(['review_notes' => ['required', 'string', 'max:2000']]);

        $dailyReport->update([
            'status' => KegiatanKkn::STATUS_REVISION,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
            'review_notes' => $request->input('review_notes'),
        ]);

        return $this->success(
            new KegiatanKknResource($dailyReport->refresh()),
            'Revisi diminta.'
        );
    }

    public function batchApprove(Request $request): JsonResponse
    {
        $request->validate(['report_ids' => ['required', 'array'], 'report_ids.*' => ['integer']]);

        $dosen = auth()->user()->dosen;
        $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');

        $count = KegiatanKkn::whereIn('id', $request->input('report_ids'))
            ->whereIn('kelompok_id', $groupIds)
            ->whereIn('status', KegiatanKkn::submittedStatuses())
            ->update([
                'status' => KegiatanKkn::STATUS_APPROVED,
                'reviewed_by' => auth()->id(),
                'reviewed_at' => now(),
            ]);

        return $this->success(['approved_count' => $count], "{$count} laporan berhasil disetujui.");
    }

    /**
     * Download file lampiran laporan harian.
     */
    public function downloadFile(FileKegiatanKkn $fileKegiatan)
    {
        $this->authorizeFileAccess($fileKegiatan);

        abort_unless(Storage::exists($fileKegiatan->file_path), 404, 'File tidak ditemukan.');

        return Storage::download($fileKegiatan->file_path, $fileKegiatan->original_name ?? basename($fileKegiatan->file_path));
    }

    /**
     * Preview file lampiran laporan harian (inline).
     */
    public function previewFile(FileKegiatanKkn $fileKegiatan)
    {
        $this->authorizeFileAccess($fileKegiatan);

        abort_unless(Storage::exists($fileKegiatan->file_path), 404, 'File tidak ditemukan.');

        return response()->file(
            Storage::path($fileKegiatan->file_path),
            ['Content-Disposition' => 'inline; filename="' . ($fileKegiatan->original_name ?? basename($fileKegiatan->file_path)) . '"']
        );
    }

    private function authorizeFileAccess(FileKegiatanKkn $fileKegiatan): void
    {
        $dosen = auth()->user()->dosen;
        abort_if(! $dosen, 403, 'Akses ditolak.');

        $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');
        $report = $fileKegiatan->kegiatan;
        abort_unless($report && $groupIds->contains($report->kelompok_id), 403, 'Akses ditolak.');
    }
}
