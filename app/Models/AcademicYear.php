<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicYear extends Model
{
    use HasFactory;

    protected $fillable = [
        'year',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public static function getActiveYear(): ?self
    {
        return \Illuminate\Support\Facades\Cache::remember('active_year', now()->addHours(24), function () {
            return self::where('is_active', true)->first();
        });
    }

    protected static function booted()
    {
        static::updated(function () {
            \Illuminate\Support\Facades\Cache::forget('active_year');
        });

        static::created(function () {
            \Illuminate\Support\Facades\Cache::forget('active_year');
        });

        static::deleted(function () {
            \Illuminate\Support\Facades\Cache::forget('active_year');
        });
    }

    public function periods(): HasMany
    {
        return $this->hasMany(Period::class);
    }
}
