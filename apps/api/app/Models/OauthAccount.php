<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class OauthAccount extends Model
{
    protected $fillable = [
        'user_id',
        'provider',
        'provider_id',
        'provider_email',
        'access_token_encrypted',
        'refresh_token_encrypted',
        'token_expires_at',
        'scopes_granted',
    ];

    protected function casts(): array
    {
        return [
            'token_expires_at' => 'datetime',
            'scopes_granted' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function setAccessTokenAttribute(?string $value): void
    {
        $this->attributes['access_token_encrypted'] = $value ? Crypt::encrypt($value) : null;
    }

    public function getAccessTokenDecryptedAttribute(): ?string
    {
        try {
            return $this->attributes['access_token_encrypted']
                ? Crypt::decrypt($this->attributes['access_token_encrypted'])
                : null;
        } catch (\Throwable) {
            return null;
        }
    }

    public function setRefreshTokenAttribute(?string $value): void
    {
        $this->attributes['refresh_token_encrypted'] = $value ? Crypt::encrypt($value) : null;
    }

    public function getRefreshTokenDecryptedAttribute(): ?string
    {
        try {
            return $this->attributes['refresh_token_encrypted']
                ? Crypt::decrypt($this->attributes['refresh_token_encrypted'])
                : null;
        } catch (\Throwable) {
            return null;
        }
    }

    public function isExpired(): bool
    {
        return $this->token_expires_at !== null && $this->token_expires_at->isPast();
    }
}
