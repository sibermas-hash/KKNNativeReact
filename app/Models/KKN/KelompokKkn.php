<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
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

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class , 'period_id');
    }

    public function lokasi(): BelongsTo
    {
        return $this->belongsTo(Lokasi::class , 'location_id');
    }

    // Relationship: A group can have multiple DPLs (Many-to-Many)
    public function dosen()
    {
        return $this->belongsToMany(Dosen::class , 'dpl_kelompok', 'kelompok_kkn_id', 'dosen_id')
            ->withPivot('role')
            ->withTimestamps();
    }

    // Helper: Get the main DPL (Ketua)
    public function ketuaDpl()
    {
        return $this->dosen()->wherePivot('role', 'Ketua')->first();
    }

    // Legacy: Keep this for backward compatibility if code still calls $group->dpl
    public function dpl()
    {
        return $this->belongsTo(Dosen::class , 'dpl_id');
    }

    public function dplPeriod(): BelongsTo
    {
        return $this->belongsTo(DplPeriod::class , 'dpl_period_id');
    }

    public function peserta(): HasMany
    {
        return $this->hasMany(PesertaKkn::class , 'kelompok_id');
    }

    public function kegiatan(): HasMany
    {
        return $this->hasMany(KegiatanKkn::class , 'kelompok_id');
    }

    public function programKerja(): HasMany
    {
        return $this->hasMany(ProgramKerja::class , 'kelompok_id');
    }

    public function laporanAkhir(): HasMany
    {
        return $this->hasMany(LaporanAkhir::class , 'kelompok_id');
    }

    public function evaluasi(): HasMany
    {
        return $this->hasMany(Evaluasi::class , 'kelompok_id');
    }

    public function nilaiKkn(): HasMany
    {
        return $this->hasMany(NilaiKkn::class , 'kelompok_id');
    }
}