<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Mahasiswa extends Model
{
    use HasFactory;

    protected $table = 'mahasiswa';

    protected $fillable = [
        'user_id',
        'nim',
        'nik',
        'nama',
        'mother_name',
        'fakultas_id',
        'prodi_id',
        'batch_year',
        'sks_completed',
        'total_sks',
        'gpa',
        'status_bta_ppi',
        'is_paid_ukt',
        'semester',
        'health_certificate_path',
        'parent_permission_path',
        'gender',
        'shirt_size',
        'birth_place',
        'birth_date',
        'master_id',
        'master_synced_at',
    ];

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'sks_completed' => 'integer',
            'total_sks' => 'integer',
            'semester' => 'integer',
            'gpa' => 'float',
            'is_paid_ukt' => 'boolean',
            'master_synced_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function fakultas(): BelongsTo
    {
        return $this->belongsTo(Fakultas::class, 'fakultas_id');
    }

    public function prodi(): BelongsTo
    {
        return $this->belongsTo(Prodi::class, 'prodi_id');
    }

    public function peserta(): HasMany
    {
        return $this->hasMany(PesertaKkn::class, 'mahasiswa_id');
    }

    public function kegiatan(): HasMany
    {
        return $this->hasMany(KegiatanKkn::class, 'mahasiswa_id');
    }

    public function laporanAkhir(): HasMany
    {
        return $this->hasMany(LaporanAkhir::class, 'mahasiswa_id');
    }

    public function evaluasi(): HasMany
    {
        return $this->hasMany(Evaluasi::class, 'mahasiswa_id');
    }

    public function evaluasiDplPeserta(): HasMany
    {
        return $this->hasMany(EvaluasiDplPeserta::class, 'mahasiswa_id');
    }

    public function nilai(): HasMany
    {
        return $this->hasMany(NilaiKkn::class, 'user_id', 'user_id');
    }

    /**
     * Dynamic identity.
     */
    public function getIdentityAttribute(): string
    {
        return "{$this->nim} - {$this->nama}";
    }

    /**
     * Dynamic completeness calculation.
     * PREVENT N+1: Only checks loaded relations.
     */
    public function getProfileCompletionAttribute(): int
    {
        $fields = ['nik', 'mother_name', 'birth_date', 'health_certificate_path', 'parent_permission_path'];
        $filled = collect($fields)->filter(fn ($f) => ! empty($this->{$f}))->count();

        $hasPhone = $this->relationLoaded('user') && ! empty($this->user?->phone);
        if ($hasPhone) {
            $filled++;
        }

        $totalFields = count($fields) + ($this->relationLoaded('user') ? 1 : 0);

        return $totalFields > 0 ? (int) (($filled / $totalFields) * 100) : 0;
    }
}
