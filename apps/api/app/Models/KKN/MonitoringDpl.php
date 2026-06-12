<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Traits\ScopedByPeriode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MonitoringDpl extends Model
{
    use HasFactory, ScopedByPeriode, SoftDeletes;

    protected $table = 'monitoring_dpl';

    protected $fillable = [
        'dpl_id',
        'kelompok_id',
        'periode_id',
        'tanggal_kunjungan',
        'permasalahan',
        'solusi',
        'catatan_tambahan',
        'latitude',
        'longitude',
        'photo_path',
    ];

    protected $casts = ['tanggal_kunjungan' => 'date'];

    /**
     * Get count of monitorings for a group in a period.
     */
    public static function getCountForGroup(int $groupId): int
    {
        return self::where('kelompok_id', $groupId)->count();
    }

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
