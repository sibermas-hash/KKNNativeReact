<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Casts;
use Illuminate\Database\Eloquent\Attributes\Hidden;

#[Connection('kkn')]
#[Table('dispensasi_kkn')]
#[Fillable([
    'nim',
        'period_id',
        'alasan',
        'bypassed_requirements',
        'granted_by',
        'is_active',
])]
#[Casts([
    'bypassed_requirements' => 'array',
        'is_active' => 'boolean',
])]
class DispensasiKkn extends Model
{
    

    

    

    

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'period_id');
    }

    public function grantedByUser(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'granted_by');
    }

    /**
     * Check if a given NIM has active dispensasi for a period.
     */
    public static function hasDispensasi(string $nim, ?int $periodId = null): bool
    {
        $query = static::where('nim', $nim)->where('is_active', true);

        if ($periodId) {
            $query->where(function ($q) use ($periodId) {
                $q->where('period_id', $periodId)->orWhereNull('period_id');
            });
        }

        return $query->exists();
    }

    /**
     * Get bypassed requirement keys for a given NIM.
     */
    public static function getBypassedRequirements(string $nim, ?int $periodId = null): array
    {
        $query = static::where('nim', $nim)->where('is_active', true);

        if ($periodId) {
            $query->where(function ($q) use ($periodId) {
                $q->where('period_id', $periodId)->orWhereNull('period_id');
            });
        }

        $dispensasi = $query->first();

        return $dispensasi?->bypassed_requirements ?? [];
    }
}
