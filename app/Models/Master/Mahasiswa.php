<?php

declare(strict_types=1);

namespace App\Models\Master;

use App\Models\KKN\Mahasiswa as KknMahasiswa;
use App\Models\User;
use Carbon\Carbon;
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

    public string $nim;

    public string $nama;

    public string $email;

    public ?string $telepon = null;

    public string $prodi;

    public int $angkatan;

    public Carbon $tanggal_lahir;

    public string $jenis_kelamin;

    public string $status;

    public function getNameAttribute(): ?string
    {
        return $this->nama;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'email', 'email')->where('email_verified_at', '!=', null);
    }

    public function kknStudent(): HasOne
    {
        return $this->hasOne(KknMahasiswa::class, 'nim', 'nim');
    }
}
