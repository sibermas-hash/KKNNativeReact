<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\PoskoKelompok;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class PoskoController extends Controller
{
    use ApiResponse;

    public function show(): JsonResponse
    {
        $user = auth()->user();
        $registration = $user->mahasiswa?->peserta()->where('status', 'approved')->where('placement_is_live', true)->with('kelompok.posko')->latest('created_at')->first();
        $posko = $registration?->kelompok?->posko;

        return $this->success([
            'id' => $posko?->id,
            'nama_posko' => $posko?->nama_posko ?? null,
            'address' => $posko?->address ?? null,
            'latitude' => $posko?->latitude !== null ? (float) $posko->latitude : null,
            'longitude' => $posko?->longitude !== null ? (float) $posko->longitude : null,
            'gmaps_link' => $posko?->gmaps_link,
            'photo_url' => $posko?->photo_path ? route('api.v1.student.posko.photo', $posko) : null,
            'photo_name' => $posko?->photo_name,
            'updated_at' => $posko?->updated_at?->toIso8601String(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = auth()->user();
        $registration = $user->mahasiswa?->peserta()->where('status', 'approved')->where('placement_is_live', true)->with('kelompok.lokasi')->latest('created_at')->first();

        if (! $registration?->kelompok_id) {
            return $this->forbidden('Anda belum ditempatkan di kelompok.');
        }

        if (strtolower((string) $registration->role) !== 'ketua') {
            return $this->forbidden('Hanya ketua kelompok yang dapat mengubah data posko.');
        }

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
            $diskName = config('filesystems.default');
            $photoPath = $file->store('posko-photos', $diskName);
            $photoName = $file->getClientOriginalName();
            $photoSize = $file->getSize();

            // Delete old photo
            if ($existingPosko?->photo_path) {
                Storage::disk($diskName)->delete($existingPosko->photo_path);
            }
        }

        $posko = PoskoKelompok::updateOrCreate(
            ['kelompok_id' => $registration->kelompok_id],
            [
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
                'gmaps_link' => $validated['gmaps_link'] ?? null,
                'photo_path' => $photoPath,
                'photo_name' => $photoName,
                'photo_size' => $photoSize,
                'uploaded_by' => $user->id,
            ]
        );

        return $this->success([
            'id' => $posko->id,
            'latitude' => (float) $posko->latitude,
            'longitude' => (float) $posko->longitude,
            'gmaps_link' => $posko->gmaps_link,
            'photo_url' => $posko->photo_path ? route('api.v1.student.posko.photo', $posko) : null,
        ], 'Data posko berhasil diperbarui.');
    }

    public function photo(PoskoKelompok $posko): Response
    {
        $user = auth()->user();
        abort_unless($user, 403);

        if ($user->hasRole('student')) {
            $registration = $user->mahasiswa?->peserta()->where('status', 'approved')->where('placement_is_live', true)->latest('created_at')->first();
            abort_if(! $registration || $registration->kelompok_id !== $posko->kelompok_id, 403);
        } elseif ($user->hasRole('dpl') && ! $user->hasRole('superadmin')) {
            $dosen = $user->dosen;
            abort_if(! $dosen, 403);
            abort_if(! $dosen->kelompokKkn()->where('kelompok_kkn.id', $posko->kelompok_id)->exists(), 403);
        } else {
            abort_unless($user->hasAnyRole(['admin', 'superadmin']), 403);
        }

        $disk = config('filesystems.default');
        abort_if(! $posko->photo_path || ! Storage::disk($disk)->exists($posko->photo_path), 404, 'Foto posko tidak ditemukan.');

        return Storage::disk($disk)->response($posko->photo_path, $posko->photo_name);
    }
}
