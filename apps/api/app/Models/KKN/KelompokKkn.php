<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Enums\KknType;
use App\Traits\ScopedByPeriode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class KelompokKkn extends Model
{
    use HasFactory, ScopedByPeriode, SoftDeletes;

    protected $table = 'kelompok_kkn';

    protected $fillable = [
        'periode_id',
        'location_id',
        'nama_kelompok',
        'code',
        'token',
        'capacity',
        'status',
        'dpl_id',
        'dpl_periode_id',
        'poster_potensi_desa_path',
        'poster_potensi_desa_name',
        'poster_potensi_desa_type',
    ];

    protected $casts = [
        'periode_id' => 'integer',
        'location_id' => 'integer',
        'dpl_id' => 'integer',
        'dpl_periode_id' => 'integer',
        'capacity' => 'integer',
    ];

    // Legacy Aliases removed as columns are now standardized

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
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

    public function evaluasiDplPeserta(): HasMany
    {
        return $this->hasMany(EvaluasiDplPeserta::class, 'kelompok_id');
    }

    public function slotTerkunci(): HasMany
    {
        return $this->hasMany(SlotTerkunci::class, 'kelompok_id');
    }

    /**
     * Get main DPL (Lecturer).
     */
    public function getKetuaDplAttribute(): ?Dosen
    {
        if ($this->relationLoaded('dosen')) {
            return $this->dosen->first(fn ($d) => $d->pivot->role === 'Ketua');
        }

        return $this->dosen()->wherePivot('role', 'Ketua')->first();
    }

    /**
     * Get KKN Type from Period.
     */
    public function getKknTypeAttribute(): KknType
    {
        $jenisKkn = $this->periode?->jenisKkn;
        if ($jenisKkn) {
            return match ($jenisKkn->code ?? 'REGULER') {
                'NUSANTARA' => KknType::NUSANTARA,
                'INTERNASIONAL' => KknType::INTERNASIONAL,
                'KOLABORASI_PTKIN' => KknType::KOLABORASI_PTKIN,
                'KAMPUNG_ZAKAT' => KknType::KAMPUNG_ZAKAT,
                'DESA_KATANA' => KknType::DESA_KATANA,
                'TEMATIK' => KknType::TEMATIK,
                default => KknType::REGULER,
            };
        }

        $jenis = $this->periode?->jenis;

        return $jenis instanceof KknType
            ? $jenis
            : KknType::tryFrom($jenis ?? 'REGULER') ?? KknType::REGULER;
    }

    /**
     * Get the KKN type for this group (method wrapper for attribute).
     */
    public function getKknType(): KknType
    {
        return $this->kkn_type;
    }

    /**
     * Sync flat dpl_id and dpl_periode_id columns from pivot table data.
     * These legacy columns are kept for backward compatibility with queries
     * that filter via kelompok_kkn.dpl_id directly.
     */
    public function syncKetuaFlatColumns(): void
    {
        $ketuaDpl = $this->dosen()->wherePivot('role', 'Ketua')->first();

        if ($ketuaDpl) {
            $dplPeriod = DplPeriod::where('dosen_id', $ketuaDpl->id)
                ->where('periode_id', $this->periode_id)
                ->where('is_active', true)
                ->first();

            $this->update([
                'dpl_id' => $ketuaDpl->id,
                'dpl_periode_id' => $dplPeriod?->id,
            ]);
        } else {
            $this->update([
                'dpl_id' => null,
                'dpl_periode_id' => null,
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
