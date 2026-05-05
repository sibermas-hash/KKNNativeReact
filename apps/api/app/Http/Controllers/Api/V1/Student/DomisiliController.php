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
            'domisili_address' => $user->address,
            'domisili_village' => $user->domicile_village_name,
            'domisili_district' => $user->domicile_district_name,
            'domisili_regency' => $user->domicile_regency_name,
            'domisili_province' => $mahasiswa?->domisili_province,
            'domisili_lat' => $mahasiswa?->domisili_lat,
            'domisili_lng' => $mahasiswa?->domisili_lng,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        $mahasiswa = $user->mahasiswa;

        $validated = $request->validate([
            'domisili_address' => ['nullable', 'string', 'max:500'],
            'domisili_village' => ['nullable', 'string', 'max:255'],
            'domisili_district' => ['nullable', 'string', 'max:255'],
            'domisili_regency' => ['nullable', 'string', 'max:255'],
            'domisili_province' => ['nullable', 'string', 'max:255'],
        ]);

        $user->update([
            'address' => $validated['domisili_address'] ?? $user->address,
            'domicile_village_name' => $validated['domisili_village'] ?? $user->domicile_village_name,
            'domicile_district_name' => $validated['domisili_district'] ?? $user->domicile_district_name,
            'domicile_regency_name' => $validated['domisili_regency'] ?? $user->domicile_regency_name,
        ]);

        if ($mahasiswa) {
            $mahasiswa->update([
                'domisili_province' => $validated['domisili_province'] ?? $mahasiswa->domisili_province,
            ]);
        }

        return $this->noContent('Data domisili berhasil diperbarui.');
    }
}
