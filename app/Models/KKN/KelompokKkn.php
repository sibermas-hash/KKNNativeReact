<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Enums\KknType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class KelompokKkn extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'kelompok_kkn';

    protected $connection = 'kkn';

    protected $fillable = [
        'period_id',
        'location_id',
        'nama_kelompok',
        'code',
        'token',
        'capacity',
        'status',
        'dpl_id',
        'dpl_period_id',
        'poster_potensi_desa_path',
        'poster_potensi_desa_name',
        'poster_potensi_desa_type',
    ];

    protected $casts = [
        'period_id' => 'integer',
        'location_id' => 'integer',
        'dpl_id' => 'integer',
        'dpl_period_id' => 'integer',
        'capacity' => 'integer',
    ];

    // Legacy Aliases using traditional accessors for codebase compatibility
    public function getLokasiIdAttribute(): ?int
    {
        return $this->location_id;
    }

    public function setLokasiIdAttribute(?int $value): void
    {
        $this->location_id = $value;
    }
    
    public function getPeriodeIdAttribute(): ?int
    {
        return $this->period_id;
    }

    public function setPeriodeIdAttribute(?int $value): void
    {
        $this->period_id = $value;
    }
    
    public function getKetuaMahasiswaIdAttribute(): ?int
    {
        return null;
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'period_id');
    }

    public function lokasi(): BelongsTo
    {
        return $this->belongsTo(Lokasi::class, 'location_id');
    }

    public function peserta(): HasMany
    {
        return $this->hasMany(PesertaKkn::class, 'kelompok_id');
    }

    public function dosen(): BelongsToMany
    {
        return $this->belongsToMany(Dosen::class, 'dpl_kelompok', 'kelompok_kkn_id', 'dosen_id')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function posko(): HasOne
    {
        return $this->hasOne(PoskoKelompok::class, 'kelompok_id');
    }

    public function kegiatan(): HasMany
    {
        return $this->hasMany(KegiatanKkn::class, 'kelompok_id');
    }

    public function programKerja(): HasMany
    {
        return $this->hasMany(ProgramKerja::class, 'kelompok_id');
    }

    public function rekapitulasiKegiatan(): HasMany
    {
        return $this->hasMany(RekapitulasiKegiatan::class, 'kelompok_id');
    }

    /**
     * Get main DPL (Lecturer).
     */
    public function getKetuaDplAttribute(): ?Dosen
    {
        if ($this->relationLoaded('dosen')) {
            return $this->dosen->first(fn($d) => $d->pivot->role === 'Ketua');
        }
        return $this->dosen()->wherePivot('role', 'Ketua')->first();
    }

    /**
     * Get KKN Type from Period.
     */
    public function getKknTypeAttribute(): KknType
    {
        $jenis = $this->periode?->jenis;
        if ($jenis instanceof KknType) {
            return $jenis;
        }
        if (is_string($jenis) && $jenis !== '') {
            return KknType::tryFrom($jenis) ?? KknType::REGULER;
        }
        return KknType::REGULER;
    }

    /**
     * Get the KKN type for this group (method wrapper for attribute).
     */
    public function getKknType(): KknType
    {
        return $this->kkn_type;
    }

    /**
     * Sync flat dpl_id and dpl_period_id columns from pivot table data.
     * These legacy columns are kept for backward compatibility with queries
     * that filter via kelompok_kkn.dpl_id directly.
     */
    public function syncKetuaFlatColumns(): void
    {
        $ketuaDpl = $this->dosen()->wherePivot('role', 'Ketua')->first();

        if ($ketuaDpl) {
            $dplPeriod = DplPeriod::where('dosen_id', $ketuaDpl->id)
                ->where('period_id', $this->period_id)
                ->where('is_active', true)
                ->first();

            $this->update([
                'dpl_id' => $ketuaDpl->id,
                'dpl_period_id' => $dplPeriod?->id,
            ]);
        } else {
            $this->update([
                'dpl_id' => null,
                'dpl_period_id' => null,
            ]);
        }
    }

    protected static function booted()
    {
        static::deleting(function ($group) {
            $group->dosen()->detach();
        });
    }
}
