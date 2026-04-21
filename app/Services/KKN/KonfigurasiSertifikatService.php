<?php

declare(strict_types=1);

namespace App\Services\KKN;

use App\Models\KKN\KonfigurasiSertifikat;
use Illuminate\Database\Eloquent\Builder;

/**
 * Service untuk mengelola konfigurasi sertifikat dengan pola Inheritance.
 *
 * Pola kerja:
 * - Baris dengan periode_id = NULL adalah konfigurasi GLOBAL (default/fallback).
 * - Baris dengan periode_id terisi adalah OVERRIDE untuk periode spesifik.
 * - Saat resolve, override selalu menang atas global.
 */
class KonfigurasiSertifikatService
{
    /**
     * Ambil satu nilai konfigurasi dengan fallback global.
     *
     * Prioritas: Spesifik Periode > Global (NULL)
     */
    public function get(string $key, int $periodeId): ?string
    {
        $config = KonfigurasiSertifikat::withoutGlobalScopes()
            ->where('config_key', $key)
            ->where(function (Builder $query) use ($periodeId) {
                $query->where('periode_id', $periodeId)
                    ->orWhereNull('periode_id');
            })
            ->orderByRaw('CASE WHEN periode_id IS NULL THEN 1 ELSE 0 END ASC')
            ->first();

        return $config?->value;
    }

    /**
     * Ambil seluruh konfigurasi untuk satu periode (merged dengan global).
     *
     * Global values di-override oleh periode-specific values.
     */
    public function getAllForPeriode(int $periodeId): array
    {
        $globals = KonfigurasiSertifikat::withoutGlobalScopes()
            ->whereNull('periode_id')
            ->pluck('value', 'config_key')
            ->toArray();

        $periodeSpecific = KonfigurasiSertifikat::withoutGlobalScopes()
            ->where('periode_id', $periodeId)
            ->pluck('value', 'config_key')
            ->toArray();

        // Periode override menimpa global
        return array_merge($globals, $periodeSpecific);
    }

    /**
     * Set konfigurasi untuk periode tertentu (upsert).
     */
    public function setForPeriode(string $key, string $value, int $periodeId): void
    {
        KonfigurasiSertifikat::withoutGlobalScopes()->updateOrCreate(
            ['config_key' => $key, 'periode_id' => $periodeId],
            ['value' => $value]
        );
    }

    /**
     * Set konfigurasi global (upsert).
     */
    public function setGlobal(string $key, string $value): void
    {
        KonfigurasiSertifikat::withoutGlobalScopes()->updateOrCreate(
            ['config_key' => $key, 'periode_id' => null],
            ['value' => $value]
        );
    }
}
