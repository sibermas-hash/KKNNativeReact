<?php

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
        'nim',
        'nama',
        'email',
        'telepon',
        'prodi',
        'angkatan',
        'tanggal_lahir',
        'jenis_kelamin',
        'status',
    ];

    protected $casts = [
        'tanggal_lahir' => 'date',
    ];

    /**
     * Accessor for backward compatibility (name → nama).
     */
    public function getNameAttribute(): ?string
    {
        return $this->nama;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'email', 'email');
    }

    /**
     * Get the corresponding KKN student record.
     */
    public function kknStudent(): HasOne
    {
        return $this->hasOne(KknMahasiswa::class, 'nim', 'nim');
    }
}
