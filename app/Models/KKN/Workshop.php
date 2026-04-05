<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workshop extends Model
{
    use HasFactory;

    protected $table = 'workshop';

    protected $fillable = [
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
        'workshop_date' => 'date',
    ];

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
}
