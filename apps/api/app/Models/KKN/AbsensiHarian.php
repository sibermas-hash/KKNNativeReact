<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AbsensiHarian extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'absensi_harian';

    protected $fillable = [
        'mahasiswa_id',
        'kelompok_id',
        'tanggal',
        'status',
        'izin_id',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'status' => 'string',
    ];

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
