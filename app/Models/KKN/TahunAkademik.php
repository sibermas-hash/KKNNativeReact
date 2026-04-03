<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

class TahunAkademik extends Model
{
    use HasFactory;

    protected $connection = 'kkn';
    protected $table = 'tahun_akademik';

    protected $fillable = [
        'year',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

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
