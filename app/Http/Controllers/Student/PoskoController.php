<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\Lokasi;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\PoskoKelompok;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PoskoController extends Controller
{
    private const GOOGLE_MAPS_COORDINATE_TOLERANCE = 0.00005;

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
            abort_if(! $registration || $registration->kelompok_id !== $posko->kelompok_id, 403, 'Anda tidak memiliki akses ke foto posko ini.');
        } elseif ($user->hasRole('dpl') && ! $user->hasRole('superadmin')) {
            $dosen = $user->dosen;
            abort_if(! $dosen, 403, 'Data dosen tidak ditemukan.');

            $isAssigned = $dosen->kelompokKkn()
                ->where('kelompok_kkn.id', $posko->kelompok_id)
                ->exists();

            abort_if(! $isAssigned, 403, 'Anda tidak memiliki akses ke foto posko ini.');
        } else {
            abort_unless($user->hasRole('superadmin'), 403, 'Anda tidak memiliki akses ke foto posko ini.');
        }

        [$disk, $path] = $this->resolvePhotoStorage($posko->photo_path);
        abort_if(! $path, 404, 'Foto posko tidak ditemukan.');

        return Storage::disk($disk)->response($path, $posko->photo_name);
    }

    public function store(Request $request): RedirectResponse
    {
        $registration = $this->getApprovedRegistration();
        abort_if(! $registration || ! $registration->kelompok, 403, 'Anda belum ditempatkan di kelompok.');
        $registration->loadMissing('kelompok.lokasi');

        // Otoritas Keamanan: Hanya Ketua yang boleh Update Lokasi Posko
        abort_if($registration->role !== 'Ketua', 403, 'Hanya Ketua Kelompok yang diizinkan memperbarui data posko.');

        $existingPosko = PoskoKelompok::where('kelompok_id', $registration->kelompok_id)->first();

        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'gmaps_link' => [
                'nullable',
                'url',
                'max:500',
                function (string $attribute, mixed $value, \Closure $fail) use ($request, $registration): void {
                    if (! is_string($value) || trim($value) === '') {
                        return;
                    }

                    $linkCoordinates = $this->extractGoogleMapsCoordinates($value);

                    if (! $linkCoordinates) {
                        $fail('Tautan Google Maps harus valid, berasal dari Google Maps, dan memuat koordinat yang bisa diverifikasi.');

                        return;
                    }

                    $latitude = (float) $request->input('latitude');
                    $longitude = (float) $request->input('longitude');

                    if (! $this->coordinatesMatch(
                        $latitude,
                        $longitude,
                        $linkCoordinates['latitude'],
                        $linkCoordinates['longitude'],
                    )) {
                        $fail('Koordinat pada tautan Google Maps tidak sesuai dengan latitude dan longitude posko.');

                        return;
                    }

                    $assignedLocation = $registration->kelompok?->lokasi;

                    if (! $assignedLocation) {
                        $fail('Data wilayah kelompok belum lengkap, sehingga tautan Google Maps belum bisa diverifikasi.');

                        return;
                    }

                    $resolvedAddress = $this->reverseGeocodeCoordinates(
                        $linkCoordinates['latitude'],
                        $linkCoordinates['longitude'],
                    );

                    if (! $resolvedAddress) {
                        $fail('Tautan Google Maps tidak dapat diverifikasi ke wilayah desa penempatan saat ini. Silakan coba lagi.');

                        return;
                    }

                    if (! $this->matchesAssignedLocation($assignedLocation, $resolvedAddress)) {
                        $fail("Tautan Google Maps harus mengarah ke wilayah {$assignedLocation->full_name}.");
                    }
                },
            ],
            'photo' => [$existingPosko ? 'nullable' : 'required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $photoPath = $existingPosko?->photo_path;
        $photoName = $existingPosko?->photo_name;
        $photoSize = $existingPosko?->photo_size;

        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $diskName = config('filesystems.default');
            $newPhotoPath = $file->store('posko-photos', $diskName);
            $newPhotoName = $file->getClientOriginalName();
            $newPhotoSize = $file->getSize();
            $disk = Storage::disk($diskName);
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
                $disk->delete($newPhotoPath);
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

        return redirect()->route('student.posko.index')->with('success', 'Data posko kelompok berhasil diperbarui.');
    }

    private function extractGoogleMapsCoordinates(string $url): ?array
    {
        $parts = parse_url($url);
        $host = strtolower($parts['host'] ?? '');

        if ($host === '' || ! $this->isGoogleMapsHost($host)) {
            return null;
        }

        $decodedUrl = urldecode($url);
        $queryString = $parts['query'] ?? '';

        if ($queryString !== '') {
            parse_str($queryString, $query);

            foreach (['q', 'query', 'll', 'destination', 'daddr', 'saddr'] as $key) {
                if (! isset($query[$key]) || ! is_string($query[$key])) {
                    continue;
                }

                $coordinates = $this->parseCoordinatePair($query[$key]);

                if ($coordinates) {
                    return $coordinates;
                }
            }
        }

        if (preg_match('/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/', $decodedUrl, $matches) === 1) {
            return [
                'latitude' => (float) $matches[1],
                'longitude' => (float) $matches[2],
            ];
        }

        if (preg_match('/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/', $decodedUrl, $matches) === 1) {
            return [
                'latitude' => (float) $matches[1],
                'longitude' => (float) $matches[2],
            ];
        }

        return null;
    }

    private function isGoogleMapsHost(string $host): bool
    {
        if ($host === 'maps.app.goo.gl') {
            return true;
        }

        return str_contains($host, 'google.') || str_contains($host, 'googleapis.com');
    }

    private function parseCoordinatePair(string $value): ?array
    {
        if (preg_match('/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/', $value, $matches) !== 1) {
            return null;
        }

        return [
            'latitude' => (float) $matches[1],
            'longitude' => (float) $matches[2],
        ];
    }

    private function reverseGeocodeCoordinates(float $latitude, float $longitude): ?array
    {
        $cacheKey = sprintf('posko.reverse_geocode.%s.%s', round($latitude, 6), round($longitude, 6));

        return Cache::remember($cacheKey, now()->addHours(12), function () use ($latitude, $longitude) {
            $response = Http::timeout(10)
                ->acceptJson()
                ->withHeaders([
                    'User-Agent' => config('app.name', 'SIM KKN').' PoskoVerifier/1.0',
                ])
                ->get('https://nominatim.openstreetmap.org/reverse', [
                    'format' => 'jsonv2',
                    'lat' => $latitude,
                    'lon' => $longitude,
                    'addressdetails' => 1,
                    'zoom' => 18,
                ]);

            if (! $response->successful()) {
                return null;
            }

            $address = $response->json('address');

            if (! is_array($address)) {
                return null;
            }

            return [
                'village' => $address['village']
                    ?? $address['hamlet']
                    ?? $address['quarter']
                    ?? $address['suburb']
                    ?? null,
                'district' => $address['city_district']
                    ?? $address['municipality']
                    ?? $address['subdistrict']
                    ?? $address['county']
                    ?? null,
                'regency' => $address['regency']
                    ?? $address['city']
                    ?? $address['county']
                    ?? null,
                'raw' => collect($address)
                    ->filter(fn ($value) => is_string($value) && filled($value))
                    ->values()
                    ->all(),
            ];
        });
    }

    private function matchesAssignedLocation(Lokasi $location, array $resolvedAddress): bool
    {
        $resolvedTokens = collect($resolvedAddress['raw'] ?? [])
            ->map(fn ($value) => $this->normalizeAdministrativeName($value))
            ->filter()
            ->values();

        $expectedVillage = $this->normalizeAdministrativeName($location->village_name);
        $expectedDistrict = $this->normalizeAdministrativeName($location->district_name);
        $expectedRegency = $this->normalizeAdministrativeName($location->regency_name);

        return $this->tokenMatches($resolvedTokens, $expectedVillage)
            && $this->tokenMatches($resolvedTokens, $expectedDistrict)
            && $this->tokenMatches($resolvedTokens, $expectedRegency);
    }

    private function tokenMatches(Collection $tokens, ?string $expected): bool
    {
        if (! $expected) {
            return true;
        }

        return $tokens->contains(function (string $token) use ($expected) {
            return $token === $expected
                || str_contains($token, $expected)
                || str_contains($expected, $token);
        });
    }

    private function normalizeAdministrativeName(?string $value): ?string
    {
        if (! filled($value)) {
            return null;
        }

        $normalized = Str::of($value)
            ->ascii()
            ->lower()
            ->replaceMatches('/\b(desa|kelurahan|kecamatan|kabupaten|kota|provinsi)\b/u', ' ')
            ->replaceMatches('/[^a-z0-9]+/u', ' ')
            ->trim()
            ->value();

        return $normalized !== '' ? $normalized : null;
    }

    private function coordinatesMatch(float $latitude, float $longitude, float $urlLatitude, float $urlLongitude): bool
    {
        return abs($latitude - $urlLatitude) <= self::GOOGLE_MAPS_COORDINATE_TOLERANCE
            && abs($longitude - $urlLongitude) <= self::GOOGLE_MAPS_COORDINATE_TOLERANCE;
    }

    private function resolvePhotoStorage(?string $path): array
    {
        if (! $path) {
            return [config('filesystems.default'), null];
        }

        // Check in order: Local, Public, Default (could be S3/R2)
        foreach (['local', 'public', config('filesystems.default')] as $diskName) {
            if (Storage::disk($diskName)->exists($path)) {
                return [$diskName, $path];
            }
        }

        return [config('filesystems.default'), null];
    }

    private function deletePhotoFromKnownDisks(?string $path): void
    {
        if (! $path) {
            return;
        }

        foreach (['local', 'public', config('filesystems.default')] as $disk) {
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
