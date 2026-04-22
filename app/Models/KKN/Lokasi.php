<?php

declare(strict_types=1);
namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lokasi extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'lokasi';
    protected $fillable = [
        'province_id',
        'regency_id',
        'district_id',
        'regency_name',
        'district_name',
        'village_code',
        'village_name',
        'address',
        'latitude',
        'longitude',
        'capacity',
        'fakultas_id',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'capacity' => 'integer',
    ];

    use HasFactory;

    protected $appends = [];

    public function fakultas(): BelongsTo
    {
        return $this->belongsTo(Fakultas::class, 'fakultas_id');
    }

    public function kelompok(): HasMany
    {
        return $this->hasMany(KelompokKkn::class, 'location_id');
    }

    public function getFullNameAttribute(): string
    {
        return collect([
            $this->village_name,
            $this->district_name,
            $this->regency_name,
        ])->filter(fn ($value) => filled($value))->implode(', ');
    }
}
