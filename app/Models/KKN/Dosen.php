<?php

namespace App\Models\KKN;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Dosen extends Model
{
    use HasFactory;

    protected $connection = 'kkn';
    protected $table = 'dosen';

    protected $fillable = [
        'user_id',
        'nip',
        'nama',
        'faculty_id',
        'phone',
        'master_id',
        'master_synced_at',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function fakultas(): BelongsTo
    {
        return $this->belongsTo(Fakultas::class, 'faculty_id');
    }

    public function kelompokKkn(): HasMany
    {
        return $this->hasMany(KelompokKkn::class, 'dpl_id');
    }

    public function profile(): MorphOne
    {
        return $this->morphOne(UserProfile::class, 'profileable');
    }
}
