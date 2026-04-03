<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
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

    protected $casts = [
        'permissions' => 'array',
        'is_active' => 'boolean',
        'last_used_at' => 'datetime',
    ];

    protected $hidden = [
        'key',
    ];

    protected static function booted()
    {
        static::saved(fn() => self::clearCache());
        static::deleted(fn() => self::clearCache());
    }

    /**
     * Scope to only active keys.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function setKeyAttribute(string $value): void
    {
        $this->attributes['key'] = $this->looksHashed($value)
            ? $value
            : Hash::make($value);
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
     * Uses caching to prevent N+1 query DoS attacks.
     */
    public static function findByPlaintext(string $candidate): ?self
    {
        // Cache all keys so middleware can distinguish invalid vs inactive keys.
        $keys = \Illuminate\Support\Facades\Cache::remember(
            'api_keys_all',
            3600, // 1 hour cache
            function () {
                return static::query()->get();
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
     */
    public static function clearCache(): void
    {
        \Illuminate\Support\Facades\Cache::forget('api_keys_active');
        \Illuminate\Support\Facades\Cache::forget('api_keys_all');
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
