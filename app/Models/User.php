<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\KKN\Fakultas;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    /**
     * Password policy: Minimum 8 characters, mixed case, numbers, and symbols.
     * Apply this across all password validation rules for consistency.
     */
    private const PASSWORD_REQUIREMENTS = 'min:8|mixed_case|numbers|symbols';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'username',
        'name',
        'email',
        'is_active',
        'must_change_password',
        'password_changed_at',
        'password',
        'avatar',
        'phone',
        'address',
        'domicile_village_name',
        'domicile_district_name',
        'domicile_regency_name',
        'address_verified_at',
        'faculty_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_active' => 'boolean',
            'must_change_password' => 'boolean',
            'password_changed_at' => 'datetime',
            'address_verified_at' => 'datetime',
            'faculty_id' => 'integer',
            'password' => 'hashed',
        ];
    }

    public function profile(): HasOne
    {
        return $this->hasOne(\App\Models\KKN\ProfilUser::class);
    }

    public function mahasiswa(): HasOne
    {
        return $this->hasOne(\App\Models\KKN\Mahasiswa::class);
    }

    public function dosen(): HasOne
    {
        return $this->hasOne(\App\Models\KKN\Dosen::class);
    }

    public function fakultas(): BelongsTo
    {
        return $this->belongsTo(Fakultas::class, 'faculty_id');
    }

    public function approvedPeserta(): HasMany
    {
        return $this->hasMany(\App\Models\KKN\PesertaKkn::class, 'approved_by');
    }

    public function reviewedKegiatan(): HasMany
    {
        return $this->hasMany(\App\Models\KKN\KegiatanKkn::class, 'reviewed_by');
    }

    public function approvedProgramKerja(): HasMany
    {
        return $this->hasMany(\App\Models\KKN\ProgramKerja::class, 'approved_by');
    }

    public function reviewedLaporanAkhir(): HasMany
    {
        return $this->hasMany(\App\Models\KKN\LaporanAkhir::class, 'reviewed_by');
    }

    public function evaluasi(): HasMany
    {
        return $this->hasMany(\App\Models\KKN\Evaluasi::class, 'evaluator_id');
    }

    public function pesertaWorkshop(): HasMany
    {
        return $this->hasMany(\App\Models\KKN\PesertaWorkshop::class);
    }

    public function nilaiKkn(): HasMany
    {
        return $this->hasMany(\App\Models\KKN\NilaiKkn::class, 'user_id');
    }

    /**
     * Get the active KKN group ID for this user (if student).
     */
    public function getActiveGroupId(): ?int
    {
        return $this->mahasiswa
            ?->peserta()
            ->where('status', 'approved')
            ->first()
            ?->kelompok_id;
    }
}
