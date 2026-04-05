<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use App\Models\User;

class ProfilUser extends Model
{
    use HasFactory;

    protected $table = 'profil_user';

    protected $fillable = [
        'user_id',
        'profileable_type',
        'profileable_id',
        'phone',
        'address',
        'avatar',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function profileable(): MorphTo
    {
        return $this->morphTo();
    }
}
