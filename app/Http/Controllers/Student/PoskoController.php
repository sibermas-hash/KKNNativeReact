<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\PoskoKelompok;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PoskoController extends Controller
{
    public function edit(): Response
    {
        $registration = $this->getApprovedRegistration();
        abort_if(! $registration || ! $registration->kelompok, 403, 'Anda belum ditempatkan di kelompok.');

        $registration->load(['kelompok.lokasi', 'kelompok.posko.uploadedBy']);
        $group = $registration->kelompok;
        $posko = $group->posko;
        
        // Status Otoritas
        $isLeader = $registration->role === 'Ketua';

        return Inertia::render('Student/Posko/Edit', [
            'isLeader' => $isLeader,
            'group' => [
                'id' => $group->id,
                'code' => $group->code,
                'name' => $group->nama_kelompok,
                'location' => $group->lokasi ? [
                    'id' => $group->lokasi->id,
                    'village_name' => $group->lokasi->village_name,
                    'district_name' => $group->lokasi->district_name,
                    'regency_name' => $group->lokasi->regency_name,
                    'full_name' => $group->lokasi->full_name,
                ] : null,
            ],
            'posko' => $posko ? [
                'id' => $posko->id,
                'latitude' => $posko->latitude !== null ? (float) $posko->latitude : null,
                'longitude' => $posko->longitude !== null ? (float) $posko->longitude : null,
                'gmaps_link' => $posko->gmaps_link,
                'photo_url' => $posko->photo_url,
                'photo_name' => $posko->photo_name,
                'updated_at' => optional($posko->updated_at)->toIso8601String(),
                'uploaded_by' => $posko->uploadedBy?->name,
            ] : null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $registration = $this->getApprovedRegistration();
        abort_if(! $registration || ! $registration->kelompok, 403, 'Anda belum ditempatkan di kelompok.');
        
        // Otoritas Keamanan: Hanya Ketua yang boleh Update Lokasi Posko
        abort_if($registration->role !== 'Ketua', 403, 'Hanya Ketua Kelompok yang diizinkan memperbarui data posko.');

        $existingPosko = PoskoKelompok::where('kelompok_id', $registration->kelompok_id)->first();

        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'gmaps_link' => ['nullable', 'url', 'max:500'],
            'photo' => [$existingPosko ? 'nullable' : 'required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $photoPath = $existingPosko?->photo_path;
        $photoName = $existingPosko?->photo_name;
        $photoSize = $existingPosko?->photo_size;

        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $newPhotoPath = $file->store('posko-photos', 'public');
            $newPhotoName = $file->getClientOriginalName();
            $newPhotoSize = $file->getSize();

            try {
                \Illuminate\Support\Facades\DB::transaction(function () use ($existingPosko, $validated, $newPhotoPath, $newPhotoName, $newPhotoSize, $request) {
                    // Delete old photo after successful DB operation
                    if ($existingPosko?->photo_path) {
                        Storage::disk('public')->delete($existingPosko->photo_path);
                    }

                    PoskoKelompok::updateOrCreate(
                        ['kelompok_id' => $registration->kelompok_id],
                        [
                            'latitude' => $validated['latitude'],
                            'longitude' => $validated['longitude'],
                            'gmaps_link' => $validated['gmaps_link'] ?? null,
                            'photo_path' => $newPhotoPath,
                            'photo_name' => $newPhotoName,
                            'photo_size' => $newPhotoSize,
                            'uploaded_by' => $request->user()?->id,
                        ],
                    );
                });
            } catch (\Exception $e) {
                // Cleanup uploaded file if DB operation fails
                Storage::disk('public')->delete($newPhotoPath);
                throw $e;
            }
        } else {
            PoskoKelompok::updateOrCreate(
                ['kelompok_id' => $registration->kelompok_id],
                [
                    'latitude' => $validated['latitude'],
                    'longitude' => $validated['longitude'],
                    'gmaps_link' => $validated['gmaps_link'] ?? null,
                    'uploaded_by' => $request->user()?->id,
                ],
            );
        }

        return redirect()->route('student.posko.edit')->with('success', 'Data posko kelompok berhasil diperbarui.');
    }

    private function getApprovedRegistration(): ?PesertaKkn
    {
        $mahasiswa = auth()->user()?->mahasiswa;

        return $mahasiswa
            ? $mahasiswa->peserta()
                ->where('status', 'approved')
                ->with('kelompok')
                ->latest()
                ->first()
            : null;
    }
}
