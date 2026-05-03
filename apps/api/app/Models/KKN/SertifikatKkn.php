<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use App\Traits\ScopedByPeriode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SertifikatKkn extends Model
{
    use ScopedByPeriode;

    protected $table = 'sertifikat_kkn';

    protected $fillable = [
        'user_id',
        'periode_id',
        'nilai_kkn_id',
        'kelompok_id',
        'certificate_number',
        'verification_token',
        'nama_mahasiswa',
        'nim',
        'nama_prodi',
        'nama_fakultas',
        'lokasi_kkn',
        'total_score',
        'letter_grade',
        'issued_at',
        'issued_by',
        'revoked_at',
        'revoke_reason',
        'revoked_by',
    ];

    protected $casts = [
        'total_score' => 'decimal:2',
        'issued_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    // ── Relasi ──────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class);
    }

    public function nilaiKkn(): BelongsTo
    {
        return $this->belongsTo(NilaiKkn::class, 'nilai_kkn_id');
    }

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function issuedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function revokedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revoked_by');
    }

    // ── Helpers ──────────────────────────────────

    public function isRevoked(): bool
    {
        return $this->revoked_at !== null;
    }

    public function isValid(): bool
    {
        return ! $this->isRevoked();
    }

    /**
     * Scope: Hanya sertifikat yang masih berlaku.
     */
    public function scopeValid($query)
    {
        return $query->whereNull('revoked_at');
    }

    /**
     * Scope: Sertifikat per periode.
     */
    public function scopeForPeriode($query, int $periodeId)
    {
        return $query->where('periode_id', $periodeId);
    }
}
