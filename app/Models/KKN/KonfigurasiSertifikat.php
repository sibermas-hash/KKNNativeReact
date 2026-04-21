<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KonfigurasiSertifikat extends Model
{
    protected $table = 'konfigurasi_sertifikat';

    protected $guarded = ['id'];

    /**
     * Relasi ke Periode.
     * NULL = konfigurasi global (default/fallback).
     * Terisi = override khusus untuk periode tersebut.
     */
    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
    }

    /**
     * Scope: hanya ambil konfigurasi global (default).
     */
    public function scopeGlobal($query)
    {
        return $query->whereNull('periode_id');
    }

    /**
     * Scope: hanya ambil konfigurasi untuk periode tertentu.
     */
    public function scopeForPeriode($query, int $periodeId)
    {
        return $query->where('periode_id', $periodeId);
    }
}
