<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DplPeriod extends Model
{

    protected $table = 'dpl_periode';

    protected $fillable = [
        'dosen_id',
        'periode_id',
        'max_kelompok_kkn',
        'is_active',
    ];

    protected $casts = [
        'max_kelompok_kkn' => 'integer',
        'is_active' => 'boolean',
    ];

    use HasFactory;

    public function dosen(): BelongsTo
    {
        return $this->belongsTo(Dosen::class, 'dosen_id');
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
    }

    public function kelompok(): HasMany
    {
        return $this->hasMany(KelompokKkn::class, 'dpl_periode_id');
    }

    /**
     * Get the remaining group capacity for this DPL-Period assignment.
     */
    public function getRemainingSlots(): int
    {
        return max(0, $this->max_kelompok_kkn - $this->kelompok()->count());
    }

    /**
     * Check if this DPL-Period assignment can take more groups.
     */
    public function hasCapacity(): bool
    {
        return $this->getRemainingSlots() > 0;
    }
}
