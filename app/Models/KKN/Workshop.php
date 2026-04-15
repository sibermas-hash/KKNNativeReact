<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class Workshop extends Model
{
    use HasFactory;

    protected $connection = 'kkn';

    protected $table = 'workshops';

    protected $fillable = [
        'periode_id',
        'title',
        'description',
        'location',
        'speaker',
        'date',
        'start_time',
        'end_time',
        'capacity',
        'is_published',
    ];

    protected $casts = [
        'periode_id' => 'integer',
        'date' => 'date',
        'capacity' => 'integer',
        'is_published' => 'boolean',
    ];

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
    }

    public function peserta(): HasMany
    {
        return $this->hasMany(PesertaWorkshop::class, 'workshop_id');
    }

    /**
     * Format start time.
     */
    public function getFormattedStartTimeAttribute(): string
    {
        return Carbon::parse($this->attributes['start_time'] ?? '00:00')->format('H:i');
    }

    /**
     * Format end time.
     */
    public function getFormattedEndTimeAttribute(): string
    {
        return Carbon::parse($this->attributes['end_time'] ?? '00:00')->format('H:i');
    }
}
