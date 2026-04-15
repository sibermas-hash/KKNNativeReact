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

    public string $nip;

    public string $nama;

    public string $email;

    public ?string $telepon = null;

    public ?string $gelar_depan = null;

    public ?string $gelar_belakang = null;

    public ?string $jabatan = null;

    public ?string $prodi = null;

    public string $status;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id')->whereNotNull('user_id');
    }

    public function kknLecturer(): HasOne
    {
        return $this->hasOne(KknDosen::class, 'nip', 'nip');
    }
}
