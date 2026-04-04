<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Periode extends Model
{
    use HasFactory, SoftDeletes;

    private const CACHE_KEYS = [
        'active_period',
        'default_period_id',
        'available_periods',
    ];

    protected $connection = 'kkn';
    protected $table = 'periode';

    protected $fillable = [
        'academic_year_id',
        'periode',
        'jenis',
        'name',
        'start_date',
        'end_date',
        'registration_start',
        'registration_end',
        'kuota',
        'is_active',
        'grading_start',
        'grading_end',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'registration_start' => 'date',
        'registration_end' => 'date',
        'grading_start' => 'date',
        'grading_end' => 'date',
        'is_active' => 'boolean',
    ];

    public static function getActivePeriod(): ?self
    {
        return \Illuminate\Support\Facades\Cache::remember('active_period', now()->addHours(24), function () {
            return self::where('is_active', true)->first();
        });
    }

    public static function flushContextCache(): void
    {
        foreach (self::CACHE_KEYS as $cacheKey) {
            \Illuminate\Support\Facades\Cache::forget($cacheKey);
        }
    }

    protected static function booted()
    {
        static::updated(function () {
            self::flushContextCache();
        });

        static::created(function () {
            self::flushContextCache();
        });

        static::deleted(function () {
            self::flushContextCache();
        });

        static::restored(function () {
            self::flushContextCache();
        });
    }

    public function tahunAkademik(): BelongsTo
    {
        return $this->belongsTo(TahunAkademik::class , 'academic_year_id');
    }

    public function kelompok(): HasMany
    {
        return $this->hasMany(KelompokKkn::class , 'period_id');
    }

    public function peserta(): HasMany
    {
        return $this->hasMany(PesertaKkn::class , 'period_id');
    }

    public function dplPeriods(): HasMany
    {
        return $this->hasMany(DplPeriod::class , 'period_id');
    }

    public function dplKecamatanAssignments(): HasMany
    {
        return $this->hasMany(DplKecamatanAssignment::class, 'period_id');
    }
}
