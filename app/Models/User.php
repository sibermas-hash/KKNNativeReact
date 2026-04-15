<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\KKN\DeviceToken;
use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\ProfilUser;
use App\Models\KKN\ProgramKerja;
use Database\Factories\UserFactory;
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

    protected $table = 'users';

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

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'must_change_password' => 'boolean',
        'password_changed_at' => 'datetime',
        'address_verified_at' => 'datetime',
        'faculty_id' => 'integer',
        'password' => 'hashed',
    ];

    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    /**
     * Password policy: Minimum 8 characters, mixed case, numbers, and symbols.
     * Apply this across all password validation rules for consistency.
     */
    public const PASSWORD_REQUIREMENTS = 'min:8|mixed_case|numbers|symbols';

    public function fakultas(): BelongsTo
    {
        return $this->belongsTo(Fakultas::class, 'faculty_id');
    }

    public function mahasiswa(): HasOne
    {
        return $this->hasOne(Mahasiswa::class, 'user_id');
    }

    public function dosen(): HasOne
    {
        return $this->hasOne(Dosen::class, 'user_id', 'id');
    }

    public function profile(): HasOne
    {
        return $this->hasOne(ProfilUser::class, 'user_id');
    }

    public function deviceTokens(): HasMany
    {
        return $this->hasMany(DeviceToken::class);
    }

    public function approvedProgramKerja(): HasMany
    {
        return $this->hasMany(ProgramKerja::class, 'approved_by');
    }

    public function reviewedLaporanAkhir(): HasMany
    {
        return $this->hasMany(LaporanAkhir::class, 'reviewed_by');
    }

    public function nilaiKkn(): HasMany
    {
        return $this->hasMany(NilaiKkn::class, 'user_id');
    }

    /**
     * Get the active KKN group ID for this user (if student).
     * SURGICAL: Uses in-memory collection check if relations are already loaded to prevent redundant DB hits.
     */
    public function getActiveGroupId(): ?int
    {
        $mahasiswa = $this->mahasiswa;
        if (! $mahasiswa) {
            return null;
        }

        // Check if nested relation 'peserta' is already loaded on the 'mahasiswa' relation
        if ($mahasiswa->relationLoaded('peserta')) {
            return $mahasiswa->peserta
                ->first(fn ($p) => $p->status === 'approved')
                ?->kelompok_id;
        }

        // Fallback to a clean, non-N+1 query
        return $mahasiswa->peserta()
            ->where('status', 'approved')
            ->value('kelompok_id');
    }
}
