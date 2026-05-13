<?php

declare(strict_types=1);

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
        'phone',
        'gelar_depan',
        'gelar_belakang',
        'jabatan',
        'prodi',
        'status',
    ];

    protected $hidden = [
        'phone',
    ];

    protected $casts = [
        'status' => 'string',
        'phone' => 'encrypted',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id')->whereNotNull('user_id');
    }

    public function kknLecturer(): HasOne
    {
        return $this->hasOne(KknDosen::class, 'nip', 'nip');
    }
}
