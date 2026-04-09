<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Schema;

class Workshop extends Model
{
    use HasFactory;

    protected static ?bool $supportsPeriodAssignment = null;

    protected $connection = 'kkn';
    protected $table = 'workshop';

    protected $fillable = [
        'period_id',
        'title',
        'description',
        'methodology',
        'workshop_date',
        'start_time',
        'end_time',
        'location',
        'max_participants',
        'latitude',
        'longitude',
        'radius_meters',
        'active_token',
        'status',
    ];

    protected $casts = [
        'period_id' => 'integer',
        'workshop_date' => 'date',
    ];

    public static function supportsPeriodAssignment(): bool
    {
        if (static::$supportsPeriodAssignment !== null) {
            return static::$supportsPeriodAssignment;
        }

        return static::$supportsPeriodAssignment = Schema::connection(config('database.kkn_connection', 'kkn'))
            ->hasColumn((new static())->getTable(), 'period_id');
    }

    public function getStartTimeAttribute($value): ?string
    {
        return $value ? substr((string) $value, 0, 5) : null;
    }

    public function getEndTimeAttribute($value): ?string
    {
        return $value ? substr((string) $value, 0, 5) : null;
    }

    public function peserta(): HasMany
    {
        return $this->hasMany(PesertaWorkshop::class, 'workshop_id');
    }

    public function participants(): HasMany
    {
        return $this->peserta();
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'period_id');
    }
}
