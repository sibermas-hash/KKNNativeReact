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

    protected $table = 'workshop';

    protected $fillable = [
        'periode_id',
        'title',
        'description',
        'methodology',
        'location',
        'speaker',
        'workshop_date',
        'start_time',
        'end_time',
        'max_participants',
        'status',
        'latitude',
        'longitude',
        'radius_meters',
        'active_token',
    ];

    protected $casts = [
        'periode_id' => 'integer',
        'workshop_date' => 'date',
        'max_participants' => 'integer',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'radius_meters' => 'integer',
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

    /**
     * Check if the workshops table supports period assignment.
     */
    public static function supportsPeriodAssignment(): bool
    {
        return in_array('periode_id', (new static)->getFillable(), true);
    }
}
