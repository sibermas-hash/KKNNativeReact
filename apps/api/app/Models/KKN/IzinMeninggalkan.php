<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IzinMeninggalkan extends Model
{
    protected $table = 'izin_meninggalkan';

    protected $fillable = [
        'mahasiswa_id',
        'kelompok_id',
        'tanggal_mulai',
        'tanggal_kembali',
        'durasi_hari',
        'alasan',
        'file_bukti',
        'status',
        'diproses_oleh',
        'diproses_pada',
        'catatan_dpl',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_kembali' => 'date',
        'diproses_pada' => 'datetime',
        // PII encryption — `alasan` sering berisi info medis/keluarga
        // sensitif. `catatan_dpl` also encrypted for privacy.
        'alasan' => 'encrypted',
        'catatan_dpl' => 'encrypted',
    ];

    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(Mahasiswa::class, 'mahasiswa_id');
    }

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function diprosesOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diproses_oleh');
    }
}
