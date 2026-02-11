<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

class Lecturer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'nip',
        'name',
        'faculty_id',
        'phone',
        'master_id',
        'master_synced_at',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    public function groups(): HasMany
    {
        return $this->hasMany(Group::class);
    }

    public function profile(): MorphOne
    {
        return $this->morphOne(UserProfile::class, 'profileable');
    }
}
