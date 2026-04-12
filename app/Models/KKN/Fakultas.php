<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Fakultas extends Model
{
    use HasFactory;

    protected $connection = 'kkn';

    protected $table = 'fakultas';

    protected $fillable = [
        'code',
        'nama',
        'master_id',
        'master_synced_at',
    ];

    protected $casts = [
        'master_synced_at' => 'datetime',
    ];

    public function dosen(): HasMany
    {
        return $this->hasMany(Dosen::class, 'faculty_id');
    }

    public function mahasiswa(): HasMany
    {
        return $this->hasMany(Mahasiswa::class, 'faculty_id');
    }

    public function prodi(): HasMany
    {
        return $this->hasMany(Prodi::class, 'faculty_id');
    }
}
