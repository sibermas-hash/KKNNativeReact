<?php

declare(strict_types=1);

namespace App\Models\Master;

use App\Models\KKN\Mahasiswa as KknMahasiswa;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Mahasiswa extends Model
{
    protected $table = 'mahasiswa';

    protected $fillable = [
        // Identitas
        'master_id',
        'user_id',
        'nim',
        'nik',
        'nama',
        'email',
        'phone',
        'alamat',

        // Akademik
        'fakultas_id',
        'prodi_id',
        'batch_year',
        'semester',
        'sks_completed',
        'gpa',

        // Demografi
        'gender',
        'birth_place',
        'birth_date',

        // Status
        'status_aktif',
        'status_bta_ppi',
        'is_paid_ukt',

        // Sync
        'master_synced_at',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'master_synced_at' => 'datetime',
        'is_paid_ukt' => 'boolean',
        'sks_completed' => 'integer',
        'gpa' => 'decimal:2',
        'semester' => 'integer',
        'batch_year' => 'integer',
    ];

    public function getNameAttribute(): ?string
    {
        return $this->nama;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function kknStudent(): HasOne
    {
        return $this->hasOne(KknMahasiswa::class, 'nim', 'nim');
    }
}
