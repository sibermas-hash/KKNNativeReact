<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Casts;

#[Connection('kkn')]
#[Table('lokasi')]
#[Fillable([
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
    'faculty_id',
])]
#[Casts([
    'latitude' => 'decimal:8',
    'longitude' => 'decimal:8',
    'capacity' => 'integer',
])]
class Lokasi extends Model
{
    use HasFactory;

    protected $appends = ['full_name'];

    public function fakultas(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Fakultas::class, 'faculty_id');
    }

    public function kelompok(): HasMany
    {
        return $this->hasMany(KelompokKkn::class, 'location_id');
    }

    public string $full_name {
        get => collect([
            $this->village_name,
            $this->district_name,
            $this->regency_name,
        ])->filter(fn ($value) => filled($value))->implode(', ');
    }
}
