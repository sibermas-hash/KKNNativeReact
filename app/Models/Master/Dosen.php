<?php

namespace App\Models\Master;

use App\Models\KKN\Dosen as KknDosen;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Dosen extends Model
{
    protected $table = 'dosen';

    protected $fillable = [
        'nip',
        'nama',
        'email',
        'telepon',
        'gelar_depan',
        'gelar_belakang',
        'jabatan',
        'prodi',
        'status',
    ];

    protected $casts = [
        'status' => 'string',
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
     * Get the corresponding KKN lecturer record.
     */
    public function kknLecturer(): HasOne
    {
        return $this->hasOne(KknDosen::class, 'nip', 'nip');
    }
}
