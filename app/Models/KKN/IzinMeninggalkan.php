<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Casts;
use Illuminate\Database\Eloquent\Attributes\Hidden;

#[Connection('kkn')]
#[Table('izin_meninggalkan')]
#[Fillable([
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
])]
#[Casts([
    'tanggal_mulai' => 'date',
        'tanggal_kembali' => 'date',
        'diproses_pada' => 'datetime',
])]
class IzinMeninggalkan extends Model
{
    

    

    

    

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
        return $this->belongsTo(\App\Models\User::class, 'diproses_oleh');
    }
}
