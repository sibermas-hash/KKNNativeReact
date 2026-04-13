<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Casts;
use Illuminate\Database\Eloquent\Attributes\Hidden;

#[Connection('kkn')]
#[Table('absensi_harian')]
#[Fillable([
    'mahasiswa_id',
        'kelompok_id',
        'tanggal',
        'status',
        'izin_id',
])]
#[Casts([
    'tanggal' => 'date',
        'status' => 'string',
])]
class AbsensiHarian extends Model
{
    use HasFactory;

    

    

    

    

    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(Mahasiswa::class, 'mahasiswa_id');
    }

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function izin(): BelongsTo
    {
        return $this->belongsTo(IzinMeninggalkan::class, 'izin_id');
    }
}
