<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Casts;
use Illuminate\Database\Eloquent\Attributes\Hidden;

#[Connection('kkn')]
#[Table('dpl_periods')]
#[Fillable([
    'dosen_id',
        'period_id',
        'max_groups',
        'is_active',
])]
#[Casts([
    'max_groups' => 'integer',
        'is_active' => 'boolean',
])]
class DplPeriod extends Model
{
    use HasFactory;

    

    

    

    

    public function dosen(): BelongsTo
    {
        return $this->belongsTo(Dosen::class, 'dosen_id');
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'period_id');
    }

    public function kelompok(): HasMany
    {
        return $this->hasMany(KelompokKkn::class, 'dpl_period_id');
    }

    /**
     * Get the remaining group capacity for this DPL-Period assignment.
     */
    public function getRemainingSlots(): int
    {
        return max(0, $this->max_groups - $this->kelompok()->count());
    }

    /**
     * Check if this DPL-Period assignment can take more groups.
     */
    public function hasCapacity(): bool
    {
        return $this->getRemainingSlots() > 0;
    }
}
