<?php

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Mahasiswa extends Model
{
    use HasFactory;

    protected $connection = 'kkn';
    protected $table = 'mahasiswa';

    protected $fillable = [
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
        'birth_place',
        'birth_date',
        'master_id',
        'master_synced_at',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'sks_completed' => 'integer',
        'total_sks' => 'integer',
        'semester' => 'integer',
        'gpa' => 'float',
        'is_bta_ppi_passed' => 'boolean',
        'master_synced_at' => 'datetime',
    ];

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

}
