<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Attributes\Connection;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Casts;
use Illuminate\Database\Eloquent\Attributes\Hidden;

#[Connection('kkn')]
#[Fillable([
    'title',
        'file_name',
        'file_path',
        'external_url',
        'file_type',
        'is_active',
])]
#[Casts([
    'is_active' => 'boolean',
])]
class Download extends Model
{
    use HasFactory;

    

    

    

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
