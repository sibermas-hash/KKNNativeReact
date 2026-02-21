<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    protected $table = '_projects';

    protected $fillable = [
        'email',
        'project_name',
        'use_case',
    ];

    public function apiKeys(): HasMany
    {
        return $this->hasMany(ApiKey::class , 'email', 'email');
    }
}