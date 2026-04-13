<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Casts;
use Illuminate\Database\Eloquent\Attributes\Hidden;

#[Connection('kkn')]
#[Table('peserta_kkn')]
#[Fillable([
    'mahasiswa_id',
        'period_id',
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
])]
#[Casts([
    'registration_date' => 'datetime',
        'approved_at' => 'datetime',
        'last_rejected_at' => 'datetime',
        'resubmitted_at' => 'datetime',
        'revision_count' => 'integer',
        'joined_group_at' => 'datetime',
        'group_locked_until' => 'datetime',
])]
class PesertaKkn extends Model
{
    use HasFactory, SoftDeletes;

    

    

    

    

    public function mahasiswa(): BelongsTo
    {
        return $this->belongsTo(Mahasiswa::class, 'mahasiswa_id');
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'period_id');
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
        $s = str_replace(['%', '_'], ['\\%', '\\_'], $search);

        return $query->whereHas('mahasiswa', function ($q) use ($s) {
            $q->where('nama', 'like', "%{$s}%")
                ->orWhere('nim', 'like', "%{$s}%");
        });
    }
}
