<?php

namespace App\Models\KKN;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Mahasiswa extends Model
{
    use HasFactory;

    protected $connection = 'kkn';
    protected $table = 'mahasiswa';

    protected $fillable = [
        'user_id',
        'nim',
        'nama',
        'faculty_id',
        'program_id',
        'batch_year',
        'gender',
        'birth_place',
        'birth_date',
        'master_id',
        'master_synced_at',
    ];

    protected $casts = [
        'birth_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Fakultas::class);
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

    public function evaluations(): HasMany
    {
        return $this->hasMany(Evaluasi::class, 'mahasiswa_id');
    }

    public function profile(): MorphOne
    {
        return $this->morphOne(UserProfile::class, 'profileable');
    }
}
