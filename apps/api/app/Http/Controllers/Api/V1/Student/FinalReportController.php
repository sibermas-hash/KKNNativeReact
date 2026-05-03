<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\LaporanAkhirResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\LaporanAkhir;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FinalReportController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $mahasiswa = auth()->user()?->mahasiswa;
        $registration = $mahasiswa?->peserta()->where('status', 'approved')->first();

        if (! $registration?->kelompok_id) {
            return $this->success(['report' => null]);
        }

        $report = LaporanAkhir::where('mahasiswa_id', $mahasiswa->id)
            ->where('kelompok_id', $registration->kelompok_id)
            ->latest('submitted_at')
            ->latest('id')
            ->first();

        return $this->success([
            'report' => $report ? new LaporanAkhirResource($report) : null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $mahasiswa = auth()->user()?->mahasiswa;
        $registration = $mahasiswa?->peserta()->where('status', 'approved')->first();

        if (! $registration?->kelompok_id) {
            return $this->forbidden('Anda belum ditempatkan di kelompok.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'abstract' => ['nullable', 'string'],
            'video_link' => ['nullable', 'url'],
            'news_link' => ['nullable', 'url'],
            'file' => ['nullable', 'file', 'mimes:pdf', 'max:20480'],
        ]);

        $filePath = null;
        $fileName = null;
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filePath = $file->store('final-reports', config('filesystems.default'));
            $fileName = $file->getClientOriginalName();
        }

        $report = LaporanAkhir::create([
            'mahasiswa_id' => $mahasiswa->id,
            'kelompok_id' => $registration->kelompok_id,
            'title' => $validated['title'],
            'abstract' => $validated['abstract'] ?? null,
            'file_path' => $filePath,
            'file_name' => $fileName,
            'video_link' => $validated['video_link'] ?? null,
            'news_link' => $validated['news_link'] ?? null,
            'status' => LaporanAkhir::STATUS_SUBMITTED,
            'submitted_at' => now(),
        ]);

        return $this->created(
            new LaporanAkhirResource($report),
            'Laporan akhir berhasil dikirim.'
        );
    }
}
