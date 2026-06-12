<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Traits\ScopedByPeriode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AntrianKkn extends Model
{
    use HasFactory, ScopedByPeriode;

    protected $table = 'antrian_kkn';

    protected $fillable = [
        'mahasiswa_id',
        'periode_id',
        'posisi_antrian',
        'status',
        'penalti_poin',
        'pindah_count',
        'joined_at',
        'last_left_group_at',
    ];

    protected $casts = [
        'joined_at' => 'datetime',
        'last_left_group_at' => 'datetime',
    ];

    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(Mahasiswa::class, 'mahasiswa_id');
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
    }
}
