<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Periode extends Model
{
    use HasFactory;

    protected $connection = 'kkn';
    protected $table = 'periode';

    protected $fillable = [
        'academic_year_id',
        'name',
        'start_date',
        'end_date',
        'registration_start',
        'registration_end',
        'is_active',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'registration_start' => 'date',
        'registration_end' => 'date',
        'is_active' => 'boolean',
    ];

    public static function getActivePeriod(): ?self
    {
        return \Illuminate\Support\Facades\Cache::remember('active_period', now()->addHours(24), function () {
            return self::where('is_active', true)->first();
        });
    }

    protected static function booted()
    {
        static::updated(function () {
            \Illuminate\Support\Facades\Cache::forget('active_period');
        });

        static::created(function () {
            \Illuminate\Support\Facades\Cache::forget('active_period');
        });

        static::deleted(function () {
            \Illuminate\Support\Facades\Cache::forget('active_period');
        });
    }

    public function tahunAkademik(): BelongsTo
    {
        return $this->belongsTo(TahunAkademik::class, 'academic_year_id');
    }

    public function kelompok(): HasMany
    {
        return $this->hasMany(KelompokKkn::class, 'period_id');
    }

    public function peserta(): HasMany
    {
        return $this->hasMany(PesertaKkn::class, 'period_id');
    }
}
