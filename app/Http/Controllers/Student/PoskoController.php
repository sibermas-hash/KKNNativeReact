<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\PoskoKelompok;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

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

    public function photo(PoskoKelompok $posko): StreamedResponse
    {
        $user = auth()->user();
        abort_unless($user, 403);

        if ($user->hasRole('student')) {
            $registration = $this->getApprovedRegistration();
            abort_if(!$registration || $registration->kelompok_id !== $posko->kelompok_id, 403, 'Anda tidak memiliki akses ke foto posko ini.');
        } elseif ($user->hasRole('dpl') && !$user->hasRole('superadmin')) {
            $dosen = $user->dosen;
            abort_if(!$dosen, 403, 'Data dosen tidak ditemukan.');

            $isAssigned = $dosen->kelompokKkn()
                ->where('kelompok_kkn.id', $posko->kelompok_id)
                ->exists();

            abort_if(!$isAssigned, 403, 'Anda tidak memiliki akses ke foto posko ini.');
        } else {
            abort_unless($user->hasRole('superadmin'), 403, 'Anda tidak memiliki akses ke foto posko ini.');
        }

        [$disk, $path] = $this->resolvePhotoStorage($posko->photo_path);
        abort_if(!$path, 404, 'Foto posko tidak ditemukan.');

        return Storage::disk($disk)->response($path, $posko->photo_name);
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
            // Issue 8 Fix: Store in private storage instead of public
            $newPhotoPath = $file->store('posko-photos', 'local');
            $newPhotoName = $file->getClientOriginalName();
            $newPhotoSize = $file->getSize();
            $connection = DB::connection('kkn');
            $persist = function () use ($existingPosko, $validated, $newPhotoPath, $newPhotoName, $newPhotoSize, $request, $registration) {
                if ($existingPosko?->photo_path) {
                    $this->deletePhotoFromKnownDisks($existingPosko->photo_path);
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
            };

            try {
                if ($connection->transactionLevel() > 0 || $connection->getPdo()->inTransaction()) {
                    $persist();
                } else {
                    $connection->transaction($persist);
                }
            } catch (\Exception $e) {
                // Cleanup uploaded file if DB operation fails
                Storage::disk('local')->delete($newPhotoPath);
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

    private function resolvePhotoStorage(?string $path): array
    {
        if (!$path) {
            return ['local', null];
        }

        if (Storage::disk('local')->exists($path)) {
            return ['local', $path];
        }

        if (Storage::disk('public')->exists($path)) {
            return ['public', $path];
        }

        return ['local', null];
    }

    private function deletePhotoFromKnownDisks(?string $path): void
    {
        if (!$path) {
            return;
        }

        foreach (['local', 'public'] as $disk) {
            if (Storage::disk($disk)->exists($path)) {
                Storage::disk($disk)->delete($path);
            }
        }
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
