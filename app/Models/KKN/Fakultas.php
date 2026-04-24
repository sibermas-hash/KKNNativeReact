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
    protected $fillable = ['nama', 'code', 'master_id', 'master_synced_at'];

    use HasFactory;

    protected function casts(): array
    {
        return [
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
}
