<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DispensasiKkn extends Model
{
    protected $connection = 'kkn';

    protected $table = 'dispensasi_kkn';

    protected $fillable = [
        'nim',
        'periode_id',
        'alasan',
        'bypassed_requirements',
        'granted_by',
        'is_active',
    ];

    protected $casts = [
        'bypassed_requirements' => 'array',
        'is_active' => 'boolean',
    ];

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
    }

    public function grantedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'granted_by');
    }

    /**
     * Check if a given NIM has active dispensasi for a period.
     */
    public static function hasDispensasi(string $nim, ?int $periodId = null): bool
    {
        $query = static::where('nim', $nim)->where('is_active', true);

        if ($periodId) {
            $query->where(function ($q) use ($periodId) {
                $q->where('periode_id', $periodId)->orWhereNull('periode_id');
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
                $q->where('periode_id', $periodId)->orWhereNull('periode_id');
            });
        }

        $dispensations = $query->get();

        return $dispensations->flatMap(fn ($item) => $item->bypassed_requirements ?? [])
            ->filter()
            ->unique()
            ->values()
            ->toArray();
    }
}
