<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Fakultas extends Model
{
    protected $table = 'fakultas';

    protected $connection = 'kkn';

    protected $fillable = ['nama', 'kode', 'master_id'];

    use HasFactory;

    public function prodi(): HasMany
    {
        return $this->hasMany(Prodi::class, 'faculty_id');
    }

    public function mahasiswa(): HasMany
    {
        return $this->hasMany(Mahasiswa::class, 'faculty_id');
    }
}
