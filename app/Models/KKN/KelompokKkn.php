<?php

declare(strict_types=1);

namespace App\Models\KKN;

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

    protected $connection = 'kkn';

    protected $table = 'kelompok_kkn';

    protected $fillable = [
        'period_id',
        'location_id',
        'dpl_id',
        'dpl_period_id',
        'code',
        'nama_kelompok',
        'token',
        'capacity',
        'status',
    ];

    protected $casts = [
        'capacity' => 'integer',
    ];

    public function getKknType(): \App\Enums\KknType
    {
        $period = $this->periode;
        if (! $period) {
            return \App\Enums\KknType::REGULER;
        }

        return $period->jenis instanceof \App\Enums\KknType
            ? $period->jenis
            : \App\Enums\KknType::tryFrom($period->jenis) ?? \App\Enums\KknType::REGULER;
    }

    public function adminGradedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'admin_graded_by');
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'period_id');
    }

    public function lokasi(): BelongsTo
    {
        return $this->belongsTo(Lokasi::class, 'location_id');
    }

    public function dpl(): BelongsTo
    {
        return $this->belongsTo(Dosen::class, 'dpl_id');
    }

    public function posko(): HasOne
    {
        return $this->hasOne(PoskoKelompok::class, 'kelompok_id');
    }

    public function slotTerkunci(): HasMany
    {
        return $this->hasMany(SlotTerkunci::class, 'kelompok_id');
    }

    public function peserta(): HasMany
    {
        return $this->hasMany(PesertaKkn::class, 'kelompok_id');
    }

    public function kegiatan(): HasMany
    {
        return $this->hasMany(KegiatanKkn::class, 'kelompok_id');
    }

    public function programKerja(): HasMany
    {
        return $this->hasMany(ProgramKerja::class, 'kelompok_id');
    }

    public function laporanAkhir(): HasMany
    {
        return $this->hasMany(LaporanAkhir::class, 'kelompok_id');
    }

    public function rekapitulasiKegiatan(): HasMany
    {
        return $this->hasMany(RekapitulasiKegiatan::class, 'kelompok_id');
    }

    // Relationship: A group can have multiple DPLs (Many-to-Many)
    public function dosen(): BelongsToMany
    {
        return $this->belongsToMany(Dosen::class, 'dpl_kelompok', 'kelompok_kkn_id', 'dosen_id')
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Get the main DPL (Ketua) record.
     */
    public function getKetuaDplAttribute(): ?Dosen
    {
        return $this->dosen()->wherePivot('role', 'Ketua')->first();
    }

    /**
     * Synchronize flat DPL columns based on the pivot 'Ketua'.
     * This is crucial for backward compatibility and simpler reporting queries.
     */
    public function syncKetuaFlatColumns(): void
    {
        $ketua = $this->dosen()->wherePivot('role', 'Ketua')->first();

        if ($ketua) {
            $dplPeriod = DplPeriod::where('dosen_id', $ketua->id)
                ->where('period_id', $this->period_id)
                ->first();

            $this->updateQuietly([
                'dpl_id' => $ketua->id,
                'dpl_period_id' => $dplPeriod?->id,
            ]);
        } else {
            $this->updateQuietly([
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
