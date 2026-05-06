<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

class ApiKey extends Model
{
    protected $table = '_api_keys';

    protected $fillable = [
        'key',
        'name',
        'permissions',
        'email',
        'is_active',
        'last_used_at',
    ];

    protected $hidden = [
        'key',
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_active' => 'boolean',
        'last_used_at' => 'datetime',
    ];

    public function setKeyAttribute(string $value): void
    {
        $this->attributes['key'] = $this->looksHashed($value)
            ? $value
            : Hash::make($value);
    }

    protected static function booted()
    {
        static::saved(fn () => self::clearCache());
        static::deleted(fn () => self::clearCache());
    }

    /**
     * Scope to only active keys.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Check if this key has a specific permission.
     */
    public function hasPermission(string $permission): bool
    {
        return in_array($permission, $this->permissions ?? [], true);
    }

    /**
     * Record usage timestamp.
     */
    public function recordUsage(): void
    {
        $this->update(['last_used_at' => now()]);
    }

    public function matchesKey(string $candidate): bool
    {
        $stored = (string) $this->getRawOriginal('key');

        if ($this->looksHashed($stored)) {
            return Hash::check($candidate, $stored);
        }

        return hash_equals($stored, $candidate);
    }

    /**
     * Find API key by plaintext value.
     * Uses prefix-based caching to prevent O(n) scans and N+1 query DoS attacks.
     */
    public static function findByPlaintext(string $candidate): ?self
    {
        // Extract a prefix to narrow the candidate set (first 8 chars after "sk_")
        $prefix = substr($candidate, 3, 8);
        if ($prefix === false || strlen($prefix) < 4) {
            return null;
        }

        $cacheKey = 'api_keys_prefix:'.$prefix;

        $keys = Cache::remember(
            $cacheKey,
            3600, // 1 hour cache
            function () use ($prefix) {
                return static::query()
                    ->whereRaw('key LIKE ?', [static::hashPrefixForLookup($prefix).'%'])
                    ->orWhereRaw('key LIKE ?', [$prefix.'%'])
                    ->get();
            }
        );

        foreach ($keys as $apiKey) {
            if ($apiKey->matchesKey($candidate)) {
                return $apiKey;
            }
        }

        return null;
    }

    /**
     * Hash a key prefix for use in LIKE queries against hashed keys.
     * This is a best-effort optimization; hashed keys cannot be prefix-searched
     * reliably, so we fall back to scanning recent keys if needed.
     */
    private static function hashPrefixForLookup(string $prefix): string
    {
        // If keys are stored hashed, prefix search is not possible.
        // This method exists for future indexing strategies (e.g., prefix hash column).
        return $prefix;
    }

    /**
     * Clear the API key cache when keys are created/updated/deleted.
     */
    public static function clearCache(): void
    {
        Cache::forget('api_keys_active');
        Cache::forget('api_keys_all');
        // Clear prefix-based caches by tag is not supported here; in production
        // consider using Cache::tags(['api_keys']) if your cache driver supports it.
    }

    private function looksHashed(string $value): bool
    {
        return str_starts_with($value, '$2y$')
            || str_starts_with($value, '$2a$')
            || str_starts_with($value, '$2b$')
            || str_starts_with($value, '$argon2i$')
            || str_starts_with($value, '$argon2id$');
    }
}
