<?php

declare(strict_types=1);

namespace App\Models\Master;

use App\Models\KKN\Mahasiswa as KknMahasiswa;
use App\Models\User;
use Illuminate\Database\Eloquent\Attributes\Cast;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Table('mahasiswa')]
class Mahasiswa extends Model
{
    #[Fillable(['nim', 'nama', 'email', 'telepon', 'prodi', 'angkatan', 'tanggal_lahir', 'jenis_kelamin', 'status'])]
    public string $nim;
    public string $nama;
    public string $email;
    public ?string $telepon = null;
    public string $prodi;
    public int $angkatan;
    #[Cast('date')]
    public \Carbon\Carbon $tanggal_lahir;
    public string $jenis_kelamin;
    public string $status;

    public ?string $name {
        get => $this->nama;
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
