<?php

declare(strict_types=1);

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Casts;

#[Connection('kkn')]
#[Table('mahasiswa')]
#[Fillable([
    'user_id',
    'nim',
    'nik',
    'nama',
    'mother_name',
    'faculty_id',
    'program_id',
    'batch_year',
    'sks_completed',
    'total_sks',
    'gpa',
    'is_bta_ppi_passed',
    'status_bta_ppi',
    'semester',
    'health_certificate_path',
    'parent_permission_path',
    'gender',
    'shirt_size',
    'birth_place',
    'birth_date',
    'master_id',
    'master_synced_at',
])]
#[Casts([
    'birth_date' => 'date',
    'sks_completed' => 'integer',
    'total_sks' => 'integer',
    'semester' => 'integer',
    'gpa' => 'float',
    'is_bta_ppi_passed' => 'boolean',
    'master_synced_at' => 'datetime',
])]
class Mahasiswa extends Model
{
    use HasFactory;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function fakultas(): BelongsTo
    {
        return $this->belongsTo(Fakultas::class, 'faculty_id');
    }

    public function prodi(): BelongsTo
    {
        return $this->belongsTo(Prodi::class, 'program_id');
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

    public function nilai(): HasMany
    {
        return $this->hasMany(NilaiKkn::class, 'user_id', 'user_id');
    }

    /**
     * PHP 8.4 Property Hook: Dynamic identity.
     */
    public string $identity {
        get => "{$this->nim} - {$this->nama}";
    }

    /**
     * PHP 8.4 Property Hook: Dynamic completeness calculation.
     * PREVENT N+1: Only checks loaded relations.
     */
    public int $profile_completion {
        get {
            $fields = ['nik', 'mother_name', 'birth_date', 'health_certificate_path', 'parent_permission_path'];
            $filled = collect($fields)->filter(fn($f) => !empty($this->{$f}))->count();
            
            $hasPhone = $this->relationLoaded('user') && !empty($this->user?->phone);
            if ($hasPhone) $filled++;
            
            $totalFields = count($fields) + ($this->relationLoaded('user') ? 1 : 0);
            return $totalFields > 0 ? (int) (($filled / $totalFields) * 100) : 0;
        }
    }
}
