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

    private function facultyScopeId(): ?int
    {
        $user = auth()->user();

        return $user?->hasRole('faculty_admin') && $user->fakultas_id
            ? (int) $user->fakultas_id
            : null;
    }

    private function scopeByFaculty($query): void
    {
        if ($facultyId = $this->facultyScopeId()) {
            $query->whereHas('mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
        }
    }

    private function ensureReportInFacultyScope(KegiatanKkn $report): void
    {
        if ($facultyId = $this->facultyScopeId()) {
            $report->loadMissing('mahasiswa');
            abort_unless($report->mahasiswa?->fakultas_id === $facultyId, 403, 'Anda tidak memiliki akses ke laporan ini.');
        }
    }

    private function ensureFileInFacultyScope(FileKegiatanKkn $file): void
    {
        if ($facultyId = $this->facultyScopeId()) {
            $file->loadMissing('kegiatan.mahasiswa');
            abort_unless($file->kegiatan?->mahasiswa?->fakultas_id === $facultyId, 403, 'Anda tidak memiliki akses ke file ini.');
        }
    }

    public function index(Request $request): JsonResponse
    {
        $query = KegiatanKkn::with(['mahasiswa.user', 'mahasiswa.prodi', 'mahasiswa.fakultas', 'kelompok.lokasi', 'fileKegiatan', 'reviewer'])
            ->when($request->input('kelompok_id'), fn ($q, $id) => $q->where('kelompok_id', $id))
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('date_from'), fn ($q, $d) => $q->whereDate('date', '>=', $d))
            ->when($request->input('date_to'), fn ($q, $d) => $q->whereDate('date', '<=', $d))
            ->when($request->input('search'), function ($q, $s) {
                $q->where(function ($qq) use ($s) {
                    $qq->where('title', 'ILIKE', "%{$s}%")
                        ->orWhere('activity', 'ILIKE', "%{$s}%")
                        ->orWhereHas('mahasiswa', fn ($mq) => $mq->where('nama', 'ILIKE', "%{$s}%")->orWhere('nim', 'ILIKE', "%{$s}%"));
                });
            })
            ->orderByDesc('date');

        $this->scopeByFaculty($query);

        $perPage = min(1000, max(10, (int) $request->input('per_page', 25)));

        return $this->successCollection(KegiatanKknResource::collection($query->paginate($perPage)));
    }

    public function show(KegiatanKkn $dailyReport): JsonResponse
    {
        $this->ensureReportInFacultyScope($dailyReport);
        $dailyReport->load(['mahasiswa.user', 'mahasiswa.prodi', 'mahasiswa.fakultas', 'kelompok.lokasi', 'fileKegiatan', 'reviewer']);

        return $this->success(new KegiatanKknResource($dailyReport));
    }

    public function approve(KegiatanKkn $dailyReport): JsonResponse
    {
        $this->ensureReportInFacultyScope($dailyReport);
        $dailyReport->update([
            'status' => KegiatanKkn::STATUS_APPROVED,
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return $this->success(new KegiatanKknResource($dailyReport->refresh()->load(['mahasiswa.user', 'kelompok.lokasi', 'fileKegiatan', 'reviewer'])), 'Laporan disetujui.');
    }

    public function revision(Request $request, KegiatanKkn $dailyReport): JsonResponse
    {
        $this->ensureReportInFacultyScope($dailyReport);
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
        $this->ensureFileInFacultyScope($fileKegiatan);
        abort_unless(Storage::exists($fileKegiatan->file_path), 404, 'File tidak ditemukan.');

        return Storage::download($fileKegiatan->file_path, $fileKegiatan->original_name ?? basename($fileKegiatan->file_path));
    }

    public function previewFile(FileKegiatanKkn $fileKegiatan)
    {
        $this->ensureFileInFacultyScope($fileKegiatan);
        abort_unless(Storage::exists($fileKegiatan->file_path), 404, 'File tidak ditemukan.');

        return response()->file(
            Storage::path($fileKegiatan->file_path),
            ['Content-Disposition' => 'inline; filename="'.($fileKegiatan->original_name ?? basename($fileKegiatan->file_path)).'"']
        );
    }
}
