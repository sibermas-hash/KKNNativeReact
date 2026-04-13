<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Connection('kkn')]
#[Table('fakultas')]
#[Fillable(['nama', 'kode', 'master_id'])]
class Fakultas extends Model
{
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
