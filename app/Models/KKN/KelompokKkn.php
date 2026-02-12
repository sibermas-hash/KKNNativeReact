<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KelompokKkn extends Model
{
    use HasFactory;

    protected $connection = 'kkn';
    protected $table = 'kelompok_kkn';

    protected $fillable = [
        'period_id',
        'location_id',
        'dpl_id',
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

    public function evaluasi(): HasMany
    {
        return $this->hasMany(Evaluasi::class, 'kelompok_id');
    }

    public function nilaiKkn(): HasMany
    {
        return $this->hasMany(NilaiKkn::class, 'kelompok_id');
    }
}
