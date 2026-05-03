<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\IzinMeninggalkan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IzinController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $mahasiswa = auth()->user()?->mahasiswa;

        if (! $mahasiswa) {
            return $this->success(['izin' => []]);
        }

        $izin = IzinMeninggalkan::where('mahasiswa_id', $mahasiswa->id)
            ->orderByDesc('created_at')
            ->get();

        return $this->success([
            'izin' => $izin->map(fn ($i) => [
                'id' => $i->id,
                'type' => $i->type,
                'reason' => $i->reason,
                'start_date' => $i->start_date?->toDateString(),
                'end_date' => $i->end_date?->toDateString(),
                'status' => $i->status,
                'rejection_reason' => $i->rejection_reason,
                'file_url' => $i->file_bukti_path ? asset('storage/'.$i->file_bukti_path) : null,
                'created_at' => $i->created_at?->toIso8601String(),
            ]),
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
            'type' => ['required', 'string', 'in:sakit,izin,keperluan_mendesak'],
            'reason' => ['required', 'string', 'max:1000'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'file_bukti' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        $filePath = null;
        if ($request->hasFile('file_bukti')) {
            $filePath = $request->file('file_bukti')->store('izin', config('filesystems.default'));
        }

        $izin = IzinMeninggalkan::create([
            'mahasiswa_id' => $mahasiswa->id,
            'kelompok_id' => $registration->kelompok_id,
            'type' => $validated['type'],
            'reason' => $validated['reason'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'file_bukti_path' => $filePath,
            'status' => 'pending',
        ]);

        return $this->created([
            'id' => $izin->id,
            'status' => $izin->status,
        ], 'Pengajuan izin berhasil dikirim.');
    }
}
