<?php

namespace App\Models\Master;

use App\Models\KKN\Fakultas;
use App\Models\KKN\Dosen as KknDosen;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Dosen extends Model
{
    protected $connection = 'master';
    protected $table = 'dosen';

    protected $fillable = [
        'nip',
        'name',
        'email',
        'phone',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'email', 'email');
    }

    /**
     * Get the corresponding KKN lecturer record.
     */
    public function kknLecturer()
    {
        return KknDosen::where('nip', $this->nip)->first();
    }
}
