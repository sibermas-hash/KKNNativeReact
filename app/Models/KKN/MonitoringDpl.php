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
#[Table('monitoring_dpl')]
#[Fillable([
    'dpl_id',
        'kelompok_id',
        'periode_id',
        'tanggal_kunjungan',
        'permasalahan',
        'solusi',
        'catatan_tambahan',
])]
#[Casts([
    'tanggal_kunjungan' => 'date',
])]
class MonitoringDpl extends Model
{
    use HasFactory;

    

    

    

    

    public function dpl(): BelongsTo
    {
        return $this->belongsTo(Dosen::class, 'dpl_id');
    }

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
    }
}
