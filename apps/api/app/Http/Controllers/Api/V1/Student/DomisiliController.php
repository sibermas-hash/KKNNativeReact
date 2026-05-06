<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DomisiliController extends Controller
{
    use ApiResponse;

    public function show(): JsonResponse
    {
        $user = auth()->user();
        $mahasiswa = $user->mahasiswa;

        return $this->success([
            'domisili_lat'          => $mahasiswa?->domisili_lat,
            'domisili_lng'          => $mahasiswa?->domisili_lng,
            'domisili_address'      => $mahasiswa?->domisili_address ?? $user->address,
            'domisili_village'      => $mahasiswa?->domisili_village ?? $user->domicile_village_name,
            'domisili_district'     => $mahasiswa?->domisili_district ?? $user->domicile_district_name,
            'domisili_regency'      => $mahasiswa?->domisili_regency ?? $user->domicile_regency_name,
            'domisili_province'     => $mahasiswa?->domisili_province,
            'domisili_postal_code'  => $mahasiswa?->domisili_postal_code,
            'domisili_registered_at' => $mahasiswa?->domisili_registered_at?->toIso8601String(),
            'address_verified_at'   => $user->address_verified_at?->toIso8601String(),
            'has_domisili'          => ! empty($mahasiswa?->domisili_lat) && ! empty($mahasiswa?->domisili_lng),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        $mahasiswa = $user->mahasiswa;

        if (! $mahasiswa) {
            return $this->forbidden('Biodata mahasiswa tidak ditemukan.');
        }

        $validated = $request->validate([
            'lat'         => ['required', 'numeric', 'between:-90,90'],
            'lng'         => ['required', 'numeric', 'between:-180,180'],
            'address'     => ['required', 'string', 'max:500'],
            'village'     => ['nullable', 'string', 'max:100'],
            'district'    => ['nullable', 'string', 'max:100'],
            'regency'     => ['nullable', 'string', 'max:100'],
            'province'    => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:10'],
        ]);

        $mahasiswa->update([
            'domisili_lat'          => $validated['lat'],
            'domisili_lng'          => $validated['lng'],
            'domisili_address'      => $validated['address'],
            'domisili_village'      => $validated['village'] ?? null,
            'domisili_district'     => $validated['district'] ?? null,
            'domisili_regency'      => $validated['regency'] ?? null,
            'domisili_province'     => $validated['province'] ?? null,
            'domisili_postal_code'  => $validated['postal_code'] ?? null,
            'domisili_registered_at' => now(),
        ]);

        // Sync ke user fields untuk keperluan verifikasi pendaftaran
        $user->update([
            'address'                => $validated['address'],
            'domicile_village_name'  => $validated['village'] ?? null,
            'domicile_district_name' => $validated['district'] ?? null,
            'domicile_regency_name'  => $validated['regency'] ?? null,
            'address_verified_at'    => now(),
        ]);

        return $this->success([
            'domisili_lat'          => $mahasiswa->domisili_lat,
            'domisili_lng'          => $mahasiswa->domisili_lng,
            'domisili_registered_at' => $mahasiswa->domisili_registered_at?->toIso8601String(),
        ], 'Lokasi domisili berhasil disimpan!');
    }
}
