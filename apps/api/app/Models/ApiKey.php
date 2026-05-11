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
        'key_prefix',
        'name',
        'permissions',
        'email',
        'is_active',
        'last_used_at',
        'expires_at',
    ];

    protected $hidden = [
        'key',
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_active' => 'boolean',
        'last_used_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Length of the searchable prefix extracted from each plaintext key.
     *
     * Plaintext layout is `sk_<32-hex>` (35 chars). 11 = "sk_" + 8 hex = enough
     * entropy to narrow `findByPlaintext` to a single row in practice, while
     * keeping the column small and cheaply indexable.
     */
    public const PREFIX_LENGTH = 11;

    /**
     * Mutator: when a plaintext key is assigned, hash it AND derive the
     * searchable prefix in one pass. Already-hashed values pass through
     * untouched (e.g. reassigning from the DB).
     *
     * CRITICAL: the prefix MUST come from the plaintext before hashing.
     * Hashed output has no usable relationship to the original string.
     */
    public function setKeyAttribute(string $value): void
    {
        if ($this->looksHashed($value)) {
            $this->attributes['key'] = $value;

            return;
        }

        $this->attributes['key_prefix'] = substr($value, 0, self::PREFIX_LENGTH);
        $this->attributes['key'] = Hash::make($value);
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
     * Scope to only non-expired keys (or keys with no expiry set).
     */
    public function scopeValid(Builder $query): Builder
    {
        return $query->where(function (Builder $q): Builder {
            return $q->whereNull('expires_at')
                ->orWhere('expires_at', '>', now());
        });
    }

    /**
     * Check if this key is expired.
     */
    public function isExpired(): bool
    {
        if ($this->expires_at === null) {
            return false;
        }

        return $this->expires_at->isPast();
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
     * Find API key by plaintext value using the indexed `key_prefix` column.
     *
     * Previous implementation ran `LIKE '<prefix>%'` against the hashed `key`
     * column — that could NEVER match (hash output has no relation to the
     * plaintext prefix), so it devolved into an O(n) table scan plus an
     * expensive Hash::check per row. This version:
     *
     *   1. Derives the prefix from the plaintext (first PREFIX_LENGTH chars).
     *   2. Queries the indexed `key_prefix` column — typically narrows to
     *      a single row.
     *   3. Runs Hash::check against the hashed `key` to confirm the candidate.
     *
     * Result stays cached per-prefix (1h) so repeated auth for the same key
     * skips the DB entirely. The prefix index is tracked separately so
     * `clearCache()` can still invalidate everything on create/update/delete.
     */
    public static function findByPlaintext(string $candidate): ?self
    {
        if (strlen($candidate) < self::PREFIX_LENGTH) {
            return null;
        }

        $prefix = substr($candidate, 0, self::PREFIX_LENGTH);
        $cacheKey = 'api_keys_prefix:'.$prefix;

        $keys = Cache::remember(
            $cacheKey,
            3600,
            function () use ($prefix, $cacheKey) {
                $index = Cache::get('api_keys_prefix_index', []);
                if (! in_array($cacheKey, $index, true)) {
                    $index[] = $cacheKey;
                    if (count($index) > 10000) {
                        array_shift($index);
                    }
                    Cache::forever('api_keys_prefix_index', $index);
                }

                return static::query()
                    ->where('key_prefix', $prefix)
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
     * Clear the API key cache when keys are created/updated/deleted.
     *
     * C-007 fix: Iterates the cached prefix index and invalidates every
     * prefix-based cache so revoked/modified keys stop authenticating
     * immediately (previously, they kept working for up to 1h TTL).
     *
     * R-006: Removed a dead `Cache::tags(['api_keys'])->flush()` branch. The
     * prefix caches in findByPlaintext() are not written with tags, so the
     * tag-flush was a silent no-op that misled readers into thinking cache
     * tags were wired up. If you wire tags in findByPlaintext() later, you
     * can add the tag flush back here.
     */
    public static function clearCache(): void
    {
        Cache::forget('api_keys_active');
        Cache::forget('api_keys_all');

        // Invalidate every prefix cache we tracked via the index.
        $index = Cache::get('api_keys_prefix_index', []);
        foreach ((array) $index as $cacheKey) {
            if (is_string($cacheKey)) {
                Cache::forget($cacheKey);
            }
        }
        Cache::forget('api_keys_prefix_index');
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
