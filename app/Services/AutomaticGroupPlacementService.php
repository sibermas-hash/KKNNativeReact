<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AutomaticGroupPlacementService
{
    public function __construct(
        private readonly GroupSelectionService $groupSelectionService,
    ) {}

    public function selectGroupForStudent(Mahasiswa $mahasiswa, int $periodId): KelompokKkn
    {
        $mahasiswa->loadMissing('user');

        $domicileRegency = $this->normalizeAdministrativeName($mahasiswa->user?->domicile_regency_name);
        if (blank($domicileRegency)) {
            throw ValidationException::withMessages([
                'periode_id' => 'Kabupaten domisili mahasiswa belum diisi. Lengkapi dan verifikasi alamat domisili terlebih dahulu di profil.',
            ]);
        }

        $candidates = KelompokKkn::query()
            ->with([
                'lokasi:id,regency_name,district_name,village_name',
                'slotTerkunci.fakultas',
                'slotTerkunci.prodi',
            ])
            ->withCount([
                'peserta as active_participants_count' => function ($query) {
                    $query->whereIn('status', GroupSelectionService::activeRegistrationStatuses());
                },
            ])
            ->where('periode_id', $periodId)
            ->where('status', 'active')
            ->whereHas('lokasi', function ($query) use ($domicileRegency) {
                $query->whereNotNull('regency_name')
                    // PRE-FILTER: Avoid home regency at database level for significantly better performance
                    // Use ILIKE with wildcards to handle "Kabupaten X" vs "X" at least partially
                    ->where('regency_name', 'not ilike', "%{$domicileRegency}%");
            })
            ->where(function ($query) {
                $query->selectRaw('count(*)')
                    ->from('peserta_kkn')
                    ->whereColumn('peserta_kkn.kelompok_id', 'kelompok_kkn.id')
                    ->whereIn('status', GroupSelectionService::activeRegistrationStatuses());
            }, '<', DB::raw('kelompok_kkn.capacity'))
            ->orderBy('active_participants_count')
            ->orderByDesc('capacity')
            ->orderBy('id');

        // Use cursor for memory stability across thousands of iterations
        foreach ($candidates->cursor() as $group) {
            try {
                $this->groupSelectionService->validateGroupAcceptance($group, $mahasiswa);

                return $group;
            } catch (ValidationException) {
                continue;
            }
        }

        throw ValidationException::withMessages([
            'periode_id' => 'Sistem belum menemukan kelompok yang tersedia di luar kabupaten asal Anda. Hubungi admin LPPM untuk penempatan manual.',
        ]);
    }

    private function normalizeAdministrativeName(?string $value): string
    {
        if (blank($value)) {
            return '';
        }

        return Str::of($value)
            ->lower()
            ->replaceMatches('/\b(kabupaten|kab\.|kota)\b/u', ' ')
            ->replaceMatches('/[^a-z0-9]+/u', ' ')
            ->trim()
            ->squish()
            ->toString();
    }
}
