<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\Mahasiswa;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DomisiliController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $mahasiswa = $user->mahasiswa;

        if (! $mahasiswa) {
            return Inertia::render('Student/Domisili/Edit', [
                'domisili' => null,
                'hasDomisili' => false,
                'message' => 'Biodata mahasiswa belum tersedia.',
            ]);
        }

        $domisili = [
            'lat' => $mahasiswa->domisili_lat,
            'lng' => $mahasiswa->domisili_lng,
            'address' => $mahasiswa->domisili_address,
            'village' => $mahasiswa->domisili_village,
            'district' => $mahasiswa->domisili_district,
            'regency' => $mahasiswa->domisili_regency,
            'province' => $mahasiswa->domisili_province,
            'postal_code' => $mahasiswa->domisili_postal_code,
            'registered_at' => $mahasiswa->domisili_registered_at,
        ];

        $hasDomisili = ! empty($mahasiswa->domisili_lat) && ! empty($mahasiswa->domisili_lng);

        return Inertia::render('Student/Domisili/Edit', [
            'domisili' => $domisili,
            'hasDomisili' => $hasDomisili,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $mahasiswa = $user->mahasiswa;

        if (! $mahasiswa) {
            return redirect()->route('student.dashboard')
                ->with('error', 'Biodata mahasiswa belum tersedia.');
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

        return redirect()->route('student.dashboard')
            ->with('success', 'Lokasi domisili berhasil disimpan!');
    }
}