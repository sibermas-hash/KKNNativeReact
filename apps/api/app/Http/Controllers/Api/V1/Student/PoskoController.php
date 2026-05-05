<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\PoskoKelompok;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PoskoController extends Controller
{
    use ApiResponse;

    public function show(): JsonResponse
    {
        $user = auth()->user();
        $registration = $user->mahasiswa?->peserta()->where('status', 'approved')->with('kelompok.posko')->first();
        $posko = $registration?->kelompok?->posko;

        return $this->success([
            'id' => $posko?->id,
            'nama_posko' => $posko?->nama_posko,
            'address' => $posko?->address,
            'latitude' => $posko?->latitude,
            'longitude' => $posko?->longitude,
            'gmaps_link' => $posko?->gmaps_link,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        $registration = $user->mahasiswa?->peserta()->where('status', 'approved')->first();

        if (! $registration?->kelompok_id) {
            return $this->forbidden('Anda belum ditempatkan di kelompok.');
        }

        $validated = $request->validate([
            'nama_posko' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
        ]);

        PoskoKelompok::updateOrCreate(
            ['kelompok_id' => $registration->kelompok_id],
            $validated
        );

        return $this->noContent('Data posko berhasil diperbarui.');
    }
}
