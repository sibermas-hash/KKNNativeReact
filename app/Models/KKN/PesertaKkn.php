<?php

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PesertaKkn extends Model
{
    use HasFactory, SoftDeletes;

    protected $connection = 'kkn';
    protected $table = 'peserta_kkn';

    protected $fillable = [
        'mahasiswa_id',
        'period_id',
        'kelompok_id',
        'status',
        'registration_date',
        'approved_at',
        'approved_by',
        'notes',
    ];

    protected $casts = [
        'registration_date' => 'datetime',
        'approved_at' => 'datetime',
    ];

    // ──── Relationships ────

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

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function dokumen(): HasMany
    {
        return $this->hasMany(DokumenPesertaKkn::class, 'peserta_kkn_id');
    }

    public function histories(): HasMany
    {
        return $this->hasMany(RegistrationHistory::class, 'peserta_kkn_id');
    }

    // ──── Query Scopes ────

    public function scopeByPeriod(Builder $query, int $periodId): Builder
    {
        return $query->where('period_id', $periodId);
    }

    public function scopeByAngkatan(Builder $query, int $angkatan): Builder
    {
        return $query->whereHas('periode', function ($q) use ($angkatan) {
            $q->where('angkatan', $angkatan);
        });
    }

    public function scopeByJenisKkn(Builder $query, string $jenis): Builder
    {
        return $query->whereHas('periode', function ($q) use ($jenis) {
            $q->where('jenis', $jenis);
        });
    }

    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    public function scopeWithGroup(Builder $query): Builder
    {
        return $query->whereNotNull('kelompok_id');
    }

    public function scopeWithoutGroup(Builder $query): Builder
    {
        return $query->whereNull('kelompok_id');
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        if (!$search) {
            return $query;
        }

        return $query->whereHas('mahasiswa', function ($q) use ($search) {
            $q->where('nama', 'like', "%{$search}%")
              ->orWhere('nim', 'like', "%{$search}%");
        });
    }
}

