<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Table('_projects')]
#[Fillable([
    'email',
    'project_name',
    'use_case',
])]
class Project extends Model
{
    public function apiKeys(): HasMany
    {
        return $this->hasMany(ApiKey::class, 'email', 'email');
    }
}
