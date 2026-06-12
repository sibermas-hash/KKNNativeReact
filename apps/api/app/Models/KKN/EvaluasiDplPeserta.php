<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Traits\ScopedByPeriode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EvaluasiDplPeserta extends Model
{
    use HasFactory, ScopedByPeriode;

    protected $table = 'evaluasi_dpl_peserta';

    protected $fillable = [
        'periode_id',
        'kelompok_id',
        'mahasiswa_id',
        'dosen_id',
        'total_score',
        'recommendation',
        'notes',
        'is_anonymous_to_dpl',
        'submitted_at',
    ];

    protected $casts = [
        'total_score' => 'decimal:2',
        'is_anonymous_to_dpl' => 'boolean',
        'submitted_at' => 'datetime',
    ];

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
    }

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(Mahasiswa::class, 'mahasiswa_id');
    }

    public function dosen(): BelongsTo
    {
        return $this->belongsTo(Dosen::class, 'dosen_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ItemEvaluasiDplPeserta::class, 'evaluasi_dpl_peserta_id');
    }
}
