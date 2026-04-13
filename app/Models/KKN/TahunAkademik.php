<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Casts;
use Illuminate\Database\Eloquent\Attributes\Hidden;

#[Connection('kkn')]
#[Table('tahun_akademik')]
#[Fillable([
    'year',
        'is_active',
])]
#[Casts([
    'is_active' => 'boolean',
])]
class TahunAkademik extends Model
{
    use HasFactory;

    

    

    

    

    public static function getActiveYear(): ?self
    {
        return Cache::remember('active_year', now()->addHours(24), function () {
            return self::where('is_active', true)->first();
        });
    }

    protected static function booted()
    {
        static::saving(function ($model) {
            // Jika tahun ini diset aktif, nonaktifkan tahun lainnya
            if ($model->is_active) {
                self::where('id', '!=', $model->id)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);

                Cache::forget('active_year');
            }
        });

        static::saved(function () {
            Cache::forget('active_year');
        });

        static::deleted(function () {
            Cache::forget('active_year');
        });
    }

    public function periode(): HasMany
    {
        return $this->hasMany(Periode::class, 'academic_year_id');
    }
}
