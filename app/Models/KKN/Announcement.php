<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    use HasFactory;

    protected $connection = 'kkn';
    protected $table = 'announcements';

    protected $fillable = [
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
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    protected static function booted()
    {
        parent::booted();

        static::creating(function ($announcement) {
            if (empty($announcement->slug)) {
                $announcement->slug = \Illuminate\Support\Str::slug($announcement->title) . '-' . uniqid();
            }
        });
    }
}
