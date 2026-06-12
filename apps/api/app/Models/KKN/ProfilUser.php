<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ProfilUser extends Model
{
    protected $table = 'profil_user';

    protected $fillable = [
        'user_id',
        'profileable_type',
        'profileable_id',
        'phone',
        'address',
        'avatar',
    ];

    use HasFactory;

    /**
     * PII encryption (Phase 3b). Columns widened to TEXT in migration
     * 2026_05_10_055000. No lookups by phone/address across the codebase.
     */
    protected $casts = [
        'phone' => 'encrypted',
        'address' => 'encrypted',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function profileable(): MorphTo
    {
        return $this->morphTo();
    }
}
