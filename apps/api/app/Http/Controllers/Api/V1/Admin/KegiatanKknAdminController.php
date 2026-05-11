<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\KegiatanKknResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\FileKegiatanKkn;
use App\Models\KKN\KegiatanKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class KegiatanKknAdminController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = KegiatanKkn::with(['mahasiswa.user', 'mahasiswa.prodi', 'mahasiswa.fakultas', 'kelompok.lokasi', 'fileKegiatan', 'reviewer'])->when($request->input('kelompok_id'), fn ($q, $id) => $q->where('kelompok_id', $id))->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))->orderByDesc('date');
        return $this->successCollection(KegiatanKknResource::collection($query->paginate(25)));
    }

    public function show(KegiatanKkn $dailyReport): JsonResponse
    {
        $dailyReport->load(['mahasiswa.user', 'mahasiswa.prodi', 'mahasiswa.fakultas', 'kelompok.lokasi', 'fileKegiatan', 'reviewer']);
        return $this->success(new KegiatanKknResource($dailyReport));
    }

    public function approve(KegiatanKkn $dailyReport): JsonResponse
    {
        $dailyReport->update([
            'status' => KegiatanKkn::STATUS_APPROVED,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return $this->success(new KegiatanKknResource($dailyReport->refresh()->load(['mahasiswa.user', 'kelompok.lokasi', 'fileKegiatan', 'reviewer'])), 'Laporan disetujui.');
    }

    public function revision(Request $request, KegiatanKkn $dailyReport): JsonResponse
    {
        $request->validate(['review_notes' => ['required', 'string', 'max:2000']]);

        $dailyReport->update([
            'status' => KegiatanKkn::STATUS_REVISION,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
            'review_notes' => $request->input('review_notes'),
        ]);

        return $this->success(new KegiatanKknResource($dailyReport->refresh()->load(['mahasiswa.user', 'kelompok.lokasi', 'fileKegiatan', 'reviewer'])), 'Revisi diminta.');
    }

    public function downloadFile(FileKegiatanKkn $fileKegiatan)
    {
        abort_unless(Storage::exists($fileKegiatan->file_path), 404, 'File tidak ditemukan.');

        return Storage::download($fileKegiatan->file_path, $fileKegiatan->original_name ?? basename($fileKegiatan->file_path));
    }

    public function previewFile(FileKegiatanKkn $fileKegiatan)
    {
        abort_unless(Storage::exists($fileKegiatan->file_path), 404, 'File tidak ditemukan.');

        return response()->file(
            Storage::path($fileKegiatan->file_path),
            ['Content-Disposition' => 'inline; filename="' . ($fileKegiatan->original_name ?? basename($fileKegiatan->file_path)) . '"']
        );
    }
}
