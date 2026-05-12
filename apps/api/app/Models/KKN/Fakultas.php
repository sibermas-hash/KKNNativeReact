<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Fakultas extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'fakultas';

    protected $fillable = ['nama', 'code', 'short_name', 'level', 'master_id', 'master_synced_at'];

    protected function casts(): array
    {
        return [
            'level' => 'integer',
            'master_synced_at' => 'datetime',
        ];
    }

    public function prodi(): HasMany
    {
        return $this->hasMany(Prodi::class, 'fakultas_id');
    }

    public function mahasiswa(): HasMany
    {
        return $this->hasMany(Mahasiswa::class, 'fakultas_id');
    }

    /**
     * Relasi balik dari Dosen. Sebelumnya hilang walaupun FK
     * `dosen.fakultas_id` exists — caller terpaksa query manual via
     * `Dosen::where('fakultas_id', $id)`. Ditambah agar konsisten dengan
     * `prodi()` dan `mahasiswa()`, plus memudahkan eager loading di
     * dashboard faculty_admin.
     */
    public function dosen(): HasMany
    {
        return $this->hasMany(Dosen::class, 'fakultas_id');
    }
}
