<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\Fakultas;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Periode;
use Illuminate\Cache\TaggableStore;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

/**
 * Redis Cache Service
 *
 * Centralized cache management for KKN system with intelligent invalidation,
 * tag-based organization, and performance optimization.
 *
 * Usage:
 *   RedisCacheService::cacheMasterData('periods', $ttl, $callback);
 *   RedisCacheService::invalidateTag('master_data');
 *   RedisCacheService::getStats();
 */
class RedisCacheService
{
    // ─────────────────────────────────────────────────────────────
    // Cache Keys & Constants
    // ─────────────────────────────────────────────────────────────

    public const TAG_MASTER_DATA = 'master_data';

    public const TAG_REGISTRATIONS = 'registrations';

    public const TAG_GROUPS = 'groups';

    public const TAG_GRADES = 'grades';

    public const TAG_REPORTS = 'reports';

    public const TAG_ASSIGNMENTS = 'assignments';

    private const TAG_INDEX_PREFIX = 'cache_tag_index.';

    // Default TTLs (in seconds)
    public const TTL_MASTER_DATA = 86400;        // 24 hours - Master data rarely changes

    public const TTL_REGISTRATIONS = 3600;       // 1 hour - Subject to frequent updates

    public const TTL_GROUPS = 7200;              // 2 hours - Stable but may change

    public const TTL_GRADES = 1800;              // 30 mins - May be updated frequently

    public const TTL_REPORTS = 900;              // 15 mins - Frequently updated

    public const TTL_ASSIGNMENTS = 3600;         // 1 hour - Semi-static

    // ─────────────────────────────────────────────────────────────
    // Master Data Caching
    // ─────────────────────────────────────────────────────────────

    /**
     * Cache master data (periods, locations, faculties, programs, etc.)
     *
     * @param  string  $key  Unique cache key
     * @param  \Closure  $callback  Data fetching callback
     * @param  int|null  $ttl  Time to live in seconds (default: 24h)
     */
    public static function cacheMasterData(string $key, \Closure $callback, ?int $ttl = null): mixed
    {
        return self::rememberTagged(
            self::TAG_MASTER_DATA,
            "master_data.{$key}",
            $callback,
            $ttl ?? self::TTL_MASTER_DATA,
        );
    }

    /**
     * Get cached periods with automatic refresh
     */
    public static function getPeriods(\Closure $callback): mixed
    {
        return self::cacheMasterData('periods', $callback);
    }

    /**
     * Get cached locations with automatic refresh
     */
    public static function getLocations(\Closure $callback): mixed
    {
        return self::cacheMasterData('locations', $callback);
    }

    /**
     * Get cached faculties with automatic refresh
     */
    public static function getFaculties(\Closure $callback): mixed
    {
        return self::cacheMasterData('faculties', $callback);
    }

    /**
     * Get cached programs with automatic refresh
     */
    public static function getPrograms(\Closure $callback): mixed
    {
        return self::cacheMasterData('programs', $callback);
    }

    /**
     * Get cached lecturers (DPL) with automatic refresh
     */
    public static function getLecturers(\Closure $callback): mixed
    {
        return self::cacheMasterData('lecturers', $callback, self::TTL_MASTER_DATA);
    }

    // ─────────────────────────────────────────────────────────────
    // Registration Caching
    // ─────────────────────────────────────────────────────────────

    /**
     * Cache registration data with shorter TTL for frequent updates
     */
    public static function cacheRegistrations(string $key, \Closure $callback, ?int $ttl = null): mixed
    {
        return self::rememberTagged(
            self::TAG_REGISTRATIONS,
            "registrations.{$key}",
            $callback,
            $ttl ?? self::TTL_REGISTRATIONS,
        );
    }

    /**
     * Cache user registrations (student-specific view)
     */
    public static function getUserRegistrations(int $userId, \Closure $callback): mixed
    {
        return self::cacheRegistrations("user_{$userId}", $callback);
    }

    /**
     * Cache period registrations (admin view)
     */
    public static function getPeriodRegistrations(int $periodId, \Closure $callback): mixed
    {
        return self::cacheRegistrations("period_{$periodId}", $callback);
    }

    // ─────────────────────────────────────────────────────────────
    // Group Caching
    // ─────────────────────────────────────────────────────────────

    /**
     * Cache group/kelompok data
     */
    public static function cacheGroups(string $key, \Closure $callback, ?int $ttl = null): mixed
    {
        return self::rememberTagged(
            self::TAG_GROUPS,
            "groups.{$key}",
            $callback,
            $ttl ?? self::TTL_GROUPS,
        );
    }

    /**
     * Cache group details by period
     */
    public static function getGroupsByPeriod(int $periodId, \Closure $callback): mixed
    {
        return self::cacheGroups("period_{$periodId}", $callback);
    }

    /**
     * Cache single group details
     */
    public static function getGroup(int $groupId, \Closure $callback): mixed
    {
        return self::cacheGroups("group_{$groupId}", $callback, self::TTL_GROUPS);
    }

    // ─────────────────────────────────────────────────────────────
    // Grade Caching
    // ─────────────────────────────────────────────────────────────

    /**
     * Cache grade/nilai data with shorter TTL as it's frequently updated
     */
    public static function cacheGrades(string $key, \Closure $callback, ?int $ttl = null): mixed
    {
        return self::rememberTagged(
            self::TAG_GRADES,
            "grades.{$key}",
            $callback,
            $ttl ?? self::TTL_GRADES,
        );
    }

    /**
     * Cache grades for a specific group
     */
    public static function getGroupGrades(int $groupId, \Closure $callback): mixed
    {
        return self::cacheGrades("group_{$groupId}", $callback);
    }

    // ─────────────────────────────────────────────────────────────
    // Report Caching
    // ─────────────────────────────────────────────────────────────

    /**
     * Cache report data with very short TTL as it's constantly updated
     */
    public static function cacheReports(string $key, \Closure $callback, ?int $ttl = null): mixed
    {
        return self::rememberTagged(
            self::TAG_REPORTS,
            "reports.{$key}",
            $callback,
            $ttl ?? self::TTL_REPORTS,
        );
    }

    /**
     * Cache daily reports for a group
     */
    public static function getGroupDailyReports(int $groupId, \Closure $callback): mixed
    {
        return self::cacheReports("daily_group_{$groupId}", $callback);
    }

    // ─────────────────────────────────────────────────────────────
    // Cache Invalidation
    // ─────────────────────────────────────────────────────────────

    /**
     * Invalidate all master data caches
     * Use when: Period, Location, Faculty, Program data changes
     */
    public static function invalidateMasterData(): bool
    {
        try {
            self::flushTagged(self::TAG_MASTER_DATA);

            return true;
        } catch (\Exception $e) {
            \Log::error('Redis invalidate master data failed', ['error' => $e->getMessage()]);

            return false;
        }
    }

    /**
     * Invalidate registration caches
     * Use when: Registration status changes, period changes
     */
    public static function invalidateRegistrations(?int $periodId = null, ?int $userId = null): bool
    {
        try {
            self::flushTagged(self::TAG_REGISTRATIONS);

            // Also invalidate related caches
            self::invalidateGroups($periodId);

            return true;
        } catch (\Exception $e) {
            \Log::error('Redis invalidate registrations failed', ['error' => $e->getMessage()]);

            return false;
        }
    }

    /**
     * Invalidate group caches
     * Use when: Group data changes, assignments change
     */
    public static function invalidateGroups(?int $periodId = null): bool
    {
        try {
            self::flushTagged(self::TAG_GROUPS);

            return true;
        } catch (\Exception $e) {
            \Log::error('Redis invalidate groups failed', ['error' => $e->getMessage()]);

            return false;
        }
    }

    /**
     * Invalidate grade caches
     * Use when: Grades are entered/updated
     */
    public static function invalidateGrades(?int $groupId = null): bool
    {
        try {
            self::flushTagged(self::TAG_GRADES);

            return true;
        } catch (\Exception $e) {
            \Log::error('Redis invalidate grades failed', ['error' => $e->getMessage()]);

            return false;
        }
    }

    /**
     * Invalidate report caches
     * Use when: Reports are submitted, reviewed, approved
     */
    public static function invalidateReports(?int $groupId = null): bool
    {
        try {
            self::flushTagged(self::TAG_REPORTS);

            return true;
        } catch (\Exception $e) {
            \Log::error('Redis invalidate reports failed', ['error' => $e->getMessage()]);

            return false;
        }
    }

    /**
     * Invalidate all caches (full reset)
     * ⚠️ Use sparingly - only for major system changes
     */
    public static function invalidateAll(): bool
    {
        try {
            Cache::flush();

            return true;
        } catch (\Exception $e) {
            \Log::error('Redis full flush failed', ['error' => $e->getMessage()]);

            return false;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Cache Management & Monitoring
    // ─────────────────────────────────────────────────────────────

    /**
     * Get Redis cache statistics
     *
     * @return array Cache stats including memory usage, hits/misses, etc.
     */
    public static function getStats(): array
    {
        try {
            $info = Redis::info();
            $memory = Redis::info('memory');

            return [
                'status' => 'connected',
                'memory_used' => $memory['used_memory_human'] ?? 'N/A',
                'memory_peak' => $memory['used_memory_peak_human'] ?? 'N/A',
                'connected_clients' => $info['connected_clients'] ?? 0,
                'total_commands' => $info['total_commands_processed'] ?? 0,
                'timestamp' => now()->toIso8601String(),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'error' => $e->getMessage(),
                'timestamp' => now()->toIso8601String(),
            ];
        }
    }

    /**
     * Get cache health status
     */
    public static function isHealthy(): bool
    {
        try {
            Redis::ping();

            return true;
        } catch (\Exception $e) {
            \Log::error('Redis health check failed', ['error' => $e->getMessage()]);

            return false;
        }
    }

    /**
     * Warm up critical caches (call on app startup)
     * This pre-loads frequently accessed data into Redis
     */
    public static function warmUp(): array
    {
        $warmed = [];

        try {
            // Warm up master data
            if (class_exists(Periode::class)) {
                self::getPeriods(fn () => Periode::with('tahunAkademik')
                    ->withCount(['kelompok', 'peserta'])
                    ->get()
                );
                $warmed[] = 'periods';
            }

            if (class_exists(Lokasi::class)) {
                self::getLocations(fn () => Lokasi::withCount('kelompok')->get());
                $warmed[] = 'locations';
            }

            if (class_exists(Fakultas::class)) {
                self::getFaculties(fn () => Fakultas::all());
                $warmed[] = 'faculties';
            }

            \Log::info('Redis cache warmup completed', ['items' => $warmed]);

            return ['success' => true, 'warmed' => $warmed];
        } catch (\Exception $e) {
            \Log::error('Redis warmup failed', ['error' => $e->getMessage()]);

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Get memory efficiency metrics
     */
    public static function getMemoryMetrics(): array
    {
        try {
            $memory = Redis::info('memory');
            $keyspace = Redis::info('keyspace');

            $used = $memory['used_memory'] ?? 0;
            $peak = $memory['used_memory_peak'] ?? $used;

            return [
                'used_bytes' => $used,
                'used_human' => $memory['used_memory_human'] ?? 'N/A',
                'peak_bytes' => $peak,
                'peak_human' => $memory['used_memory_peak_human'] ?? 'N/A',
                'evicted_keys' => $memory['evicted_keys'] ?? 0,
                'total_keys' => $keyspace['db0']['keys'] ?? 0,
                'avg_key_size' => $used > 0 ? round($used / max(($keyspace['db0']['keys'] ?? 1), 1)) : 0,
            ];
        } catch (\Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }

    private static function rememberTagged(string $tag, string $key, \Closure $callback, int $ttl): mixed
    {
        if (self::supportsTags()) {
            return Cache::tags([$tag])->remember($key, $ttl, $callback);
        }

        self::rememberFallbackIndex($tag, $key);

        return Cache::remember($key, $ttl, $callback);
    }

    private static function flushTagged(string $tag): void
    {
        if (self::supportsTags()) {
            Cache::tags([$tag])->flush();

            return;
        }

        $indexKey = self::tagIndexKey($tag);
        $keys = Cache::get($indexKey, []);

        foreach ((array) $keys as $key) {
            Cache::forget($key);
        }

        Cache::forget($indexKey);
    }

    private static function rememberFallbackIndex(string $tag, string $key): void
    {
        $indexKey = self::tagIndexKey($tag);
        $keys = Cache::get($indexKey, []);
        $keys[] = $key;

        Cache::forever($indexKey, array_values(array_unique($keys)));
    }

    private static function tagIndexKey(string $tag): string
    {
        return self::TAG_INDEX_PREFIX.$tag;
    }

    private static function supportsTags(): bool
    {
        return Cache::getStore() instanceof TaggableStore;
    }
}
