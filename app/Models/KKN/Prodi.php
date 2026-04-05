<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prodi extends Model
{
    use HasFactory;

    protected $table = 'prodi';

    protected $fillable = [
        'faculty_id',
        'code',
        'nama',
        'master_id',
        'master_synced_at',
    ];

    protected $casts = [
        'faculty_id' => 'integer',
        'master_synced_at' => 'datetime',
    ];

    public function fakultas(): BelongsTo
    {
        return $this->belongsTo(Fakultas::class , 'faculty_id');
    }

    public function mahasiswa(): HasMany
    {
        return $this->hasMany(Mahasiswa::class , 'program_id');
    }
}