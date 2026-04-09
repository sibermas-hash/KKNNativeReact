<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Model;

class IzinMeninggalkan extends Model
{
    protected $connection = 'kkn';
    protected $table = 'izin_meninggalkan';

    protected $fillable = [
        'mahasiswa_id',
        'kelompok_id',
        'tanggal_mulai',
        'tanggal_kembali',
        'durasi_hari',
        'alasan',
        'status',
        'diproses_oleh',
        'diproses_pada',
        'catatan_dpl',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_kembali' => 'date',
        'diproses_pada' => 'datetime',
    ];

    public function mahasiswa()
    {
        return $this->belongsTo(Mahasiswa::class, 'mahasiswa_id');
    }

    public function kelompok()
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function diprosesOleh()
    {
        return $this->belongsTo(\App\Models\User::class, 'diproses_oleh');
    }
}
