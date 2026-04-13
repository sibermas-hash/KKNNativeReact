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
#[Table('antrian_kkn')]
#[Fillable([
    'mahasiswa_id',
        'period_id',
        'posisi_antrian',
        'status',
        'penalti_poin',
        'pindah_count',
        'joined_at',
        'last_left_group_at',
])]
#[Casts([
    'joined_at' => 'datetime',
        'last_left_group_at' => 'datetime',
])]
class AntrianKkn extends Model
{
    use HasFactory;

    

    

    

    

    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(Mahasiswa::class, 'mahasiswa_id');
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'period_id');
    }
}
