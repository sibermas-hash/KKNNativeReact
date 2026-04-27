<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KKN\Mahasiswa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class DomisiliController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $mahasiswa = $user->mahasiswa;

        if (! $mahasiswa) {
            return response()->json([
                'success' => false,
                'message' => 'Biodata mahasiswa tidak ditemukan.',
            ], 404);
        }

        $hasDomisili = ! empty($mahasiswa->domisili_lat) && ! empty($mahasiswa->domisili_lng);

        return response()->json([
            'success' => true,
            'domisili' => [
                'lat' => $mahasiswa->domisili_lat,
                'lng' => $mahasiswa->domisili_lng,
                'address' => $mahasiswa->domisili_address,
                'village' => $mahasiswa->domisili_village,
                'district' => $mahasiswa->domisili_district,
                'regency' => $mahasiswa->domisili_regency,
                'province' => $mahasiswa->domisili_province,
                'postal_code' => $mahasiswa->domisili_postal_code,
                'registered_at' => $mahasiswa->domisili_registered_at?->toIso8601String(),
            ],
            'has_domisili' => $hasDomisili,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $mahasiswa = $user->mahasiswa;

        if (! $mahasiswa) {
            return response()->json([
                'success' => false,
                'message' => 'Biodata mahasiswa tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
            'address' => 'required|string|max:500',
            'village' => 'nullable|string|max:100',
            'district' => 'nullable|string|max:100',
            'regency' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:10',
        ]);

        $mahasiswa->update([
            'domisili_lat' => $validated['lat'],
            'domisili_lng' => $validated['lng'],
            'domisili_address' => $validated['address'],
            'domisili_village' => $validated['village'] ?? null,
            'domisili_district' => $validated['district'] ?? null,
            'domisili_regency' => $validated['regency'] ?? null,
            'domisili_province' => $validated['province'] ?? null,
            'domisili_postal_code' => $validated['postal_code'] ?? null,
            'domisili_registered_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lokasi domisili berhasil disimpan!',
            'domisili' => [
                'lat' => $mahasiswa->domisili_lat,
                'lng' => $mahasiswa->domisili_lng,
                'registered_at' => $mahasiswa->domisili_registered_at?->toIso8601String(),
            ],
        ]);
    }
}