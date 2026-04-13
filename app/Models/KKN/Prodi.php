<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Casts;

#[Connection('kkn')]
#[Table('prodi')]
#[Fillable(['faculty_id', 'nama', 'kode', 'jenjang', 'master_id'])]
#[Casts(['faculty_id' => 'integer'])]
class Prodi extends Model
{
    use HasFactory;

    public function fakultas(): BelongsTo
    {
        return $this->belongsTo(Fakultas::class, 'faculty_id');
    }

    public function mahasiswa(): HasMany
    {
        return $this->hasMany(Mahasiswa::class, 'program_id');
    }
}
