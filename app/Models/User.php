<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

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
        'password',
        'avatar',
        'phone',
        'address',
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
            'password' => 'hashed',
        ];
    }

    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    public function mahasiswa(): HasOne
    {
        return $this->hasOne(\App\Models\KKN\Mahasiswa::class);
    }

    public function dosen(): HasOne
    {
        return $this->hasOne(\App\Models\KKN\Dosen::class);
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

    public function evaluations(): HasMany
    {
        return $this->hasMany(\App\Models\KKN\Evaluasi::class, 'evaluator_id');
    }

    public function workshopParticipations(): HasMany
    {
        return $this->hasMany(\App\Models\KKN\PesertaWorkshop::class);
    }

    public function nilaiKkn(): HasMany
    {
        return $this->hasMany(\App\Models\KKN\NilaiKkn::class, 'mahasiswa_id');
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
