<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MonitoringDpl extends Model
{
    protected $connection = 'kkn';

    protected $table = 'monitoring_dpl';

    protected $fillable = [
    'dpl_id',
    'kelompok_id',
    'periode_id',
    'tanggal_kunjungan',
    'permasalahan',
    'solusi',
    'catatan_tambahan',
];

    protected $casts = ['tanggal_kunjungan' => 'date'];

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
