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
#[Table('announcements')]
#[Fillable([
    'title',
        'slug',
        'category',
        'content',
        'image',
        'is_active',
        'published_at',
        'meta_title',
        'meta_description',
        'meta_keywords',
])]
#[Casts([
    'is_active' => 'boolean',
        'published_at' => 'datetime',
])]
class Announcement extends Model
{
    use HasFactory;

    

    

    

    

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    protected static function booted()
    {
        parent::booted();

        static::creating(function ($announcement) {
            if (empty($announcement->slug)) {
                $announcement->slug = \Illuminate\Support\Str::slug($announcement->title).'-'.uniqid();
            }
        });
    }
}
