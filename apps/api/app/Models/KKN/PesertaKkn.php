<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use App\Traits\ScopedByPeriode;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PesertaKkn extends Model
{
    use HasFactory, ScopedByPeriode, SoftDeletes;

    protected $table = 'peserta_kkn';

    protected $fillable = [
        'mahasiswa_id',
        'periode_id',
        'kelompok_id',
        'status',
        'role',
        'notes',
        'rejection_reason',
        'registration_date',
        'approved_at',
        'approved_by',
        'last_rejected_at',
        'last_rejected_by',
        'resubmitted_at',
        'revision_count',
        'joined_group_at',
        'group_locked_until',
        'notification_shown',
    ];

    protected function casts(): array
    {
        return [
            'registration_date' => 'datetime',
            'approved_at' => 'datetime',
            'last_rejected_at' => 'datetime',
            'resubmitted_at' => 'datetime',
            'revision_count' => 'integer',
            'joined_group_at' => 'datetime',
            'group_locked_until' => 'datetime',
            // R11 audit-pendaftaran fix — field di fillable tapi sebelumnya
            // tidak di-cast, sehingga strict comparison (PHP 8 strict_types)
            // bisa fail terhadap nilai string "0"/"1" dari PostgreSQL.
            'notification_shown' => 'boolean',
        ];
    }

    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(Mahasiswa::class, 'mahasiswa_id');
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
    }

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function dokumen(): HasMany
    {
        return $this->hasMany(DokumenPesertaKkn::class, 'peserta_kkn_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'last_rejected_by');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'peserta_kkn_id');
    }

    public function locationDispensations(): HasMany
    {
        return $this->hasMany(LocationDispensation::class, 'peserta_kkn_id');
    }

    /**
     * Scope to find the leader of a group.
     */
    public function scopeKetua(Builder $query): Builder
    {
        return $query->where('role', 'Ketua');
    }

    /**
     * Scope for searching students by NIM or Name.
     */
    public function scopeSearch(Builder $query, string $search): Builder
    {
        // `nim` is encrypted at rest — LIKE substring match cannot work.
        // We search by `nama` (plaintext) with LIKE, and ALSO match on
        // `nim_bidx` (HMAC blind index) when the input looks like a full
        // NIM. Partial-NIM search is intentionally dropped; it's not
        // recoverable without plaintext column.
        $s = str_replace(['%', '_'], ['\\%', '\\_'], $search);

        return $query->whereHas('mahasiswa', function ($q) use ($s, $search) {
            $q->where('nama', 'like', "%{$s}%");
            if (preg_match('/^\d{6,20}$/', trim($search))) {
                $q->orWhere('nim_bidx', \App\Models\KKN\Mahasiswa::computeBlindIndex(trim($search)));
            }
        });
    }
}
