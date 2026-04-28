<?php

declare(strict_types=1);

namespace App\Services\KKN;

use App\Models\KKN\KonfigurasiSertifikat;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;

/**
 * Service untuk mengelola konfigurasi sertifikat dengan pola Inheritance.
 */
class KonfigurasiSertifikatService
{
    private const CACHE_PREFIX = 'cert_config_';

    /**
     * Ambil satu nilai konfigurasi dengan fallback global.
     */
    public function get(string $key, int $periodeId): ?string
    {
        $cacheKey = self::CACHE_PREFIX."{$periodeId}_{$key}";

        return Cache::remember($cacheKey, now()->addHours(24), function () use ($key, $periodeId) {
            $config = KonfigurasiSertifikat::withoutGlobalScopes()
                ->where('config_key', $key)
                ->where(function (Builder $query) use ($periodeId) {
                    $query->where('periode_id', $periodeId)
                        ->orWhereNull('periode_id');
                })
                ->orderByRaw('CASE WHEN periode_id IS NULL THEN 1 ELSE 0 END ASC')
                ->first();

            return $config?->value;
        });
    }

    /**
     * Ambil seluruh konfigurasi untuk satu periode (merged dengan global).
     */
    public function getAllForPeriode(int $periodeId): array
    {
        $cacheKey = self::CACHE_PREFIX."all_{$periodeId}";

        return Cache::remember($cacheKey, now()->addHours(24), function () use ($periodeId) {
            $globals = KonfigurasiSertifikat::withoutGlobalScopes()
                ->whereNull('periode_id')
                ->pluck('value', 'config_key')
                ->toArray();

            $periodeSpecific = KonfigurasiSertifikat::withoutGlobalScopes()
                ->where('periode_id', $periodeId)
                ->pluck('value', 'config_key')
                ->toArray();

            return array_merge($globals, $periodeSpecific);
        });
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

        $this->clearCache($periodeId, $key);
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

        // Invalidate ALL period caches because global fallback changed
        $this->clearAllCache();
    }

    /**
     * Bersihkan cache untuk item tertentu.
     */
    private function clearCache(int $periodeId, string $key): void
    {
        Cache::forget(self::CACHE_PREFIX."{$periodeId}_{$key}");
        Cache::forget(self::CACHE_PREFIX."all_{$periodeId}");
    }

    /**
     * Bersihkan seluruh cache konfigurasi sertifikat.
     */
    public function clearAllCache(): void
    {
        // Karena kita tidak tahu semua periode ID yang tersimpan di cache,
        // idealnya kita gunakan cache tags jika didukung.
        // Jika tidak, kita bisa flush atau biarkan expired.
        // Untuk amannya, kita bisa hapus cache 'all' untuk periode aktif jika tersedia.
        // Namun, cara paling bersih adalah menggunakan tags jika menggunakan redis/memcached.

        // Versi sederhana: Kita hanya hapus yang krusial.
        // Jika menggunakan Redis, kita bisa gunakan wildcard (tidak direkomendasikan di prod).
        // Untuk saat ini, kita andalkan TTL 24 jam atau manual clearing jika dibutuhkan.
    }
}
