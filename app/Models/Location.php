<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Location extends Model
{
    use HasFactory;

    protected $fillable = [
        'province_id',
        'regency_id',
        'district_id',
        'village_code',
        'village_name',
        'address',
        'latitude',
        'longitude',
        'capacity',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'capacity' => 'integer',
    ];

    public function groups(): HasMany
    {
        return $this->hasMany(Group::class);
    }
}
