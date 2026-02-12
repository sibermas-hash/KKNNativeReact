<?php

namespace App\Models\Master;

use App\Models\KKN\Fakultas;
use App\Models\KKN\Prodi;
use App\Models\KKN\Mahasiswa as KknMahasiswa;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Mahasiswa extends Model
{
    protected $connection = 'master';
    protected $table = 'mahasiswa';

    protected $fillable = [
        'nim',
        'name',
        'email',
        'faculty_code',
        'program_code',
        'batch_year',
        'gender',
        'birth_place',
        'birth_date',
    ];

    protected $casts = [
        'birth_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'email', 'email');
    }

    /**
     * Get the corresponding KKN student record.
     */
    public function kknStudent()
    {
        return KknMahasiswa::where('nim', $this->nim)->first();
    }
}
