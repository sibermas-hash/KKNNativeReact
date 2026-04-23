<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Announcement extends Model
{
    protected $table = 'announcements';

    public const CATEGORY_OPTIONS = [
        'PENGUMUMAN',
        'BERITA',
        'AGENDA',
        'PEDOMAN',
        'PRESS RELEASE',
        'KEMITRAAN',
    ];

    protected $fillable = [
        'title',
        'slug',
        'category',
        'excerpt',
        'content',
        'image',
        'file_path',
        'file_name',
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

    use HasFactory;

    public function scopeActive($query)
    {
        return $query
            ->where('is_active', true)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function scopeOrdered($query)
    {
        return $query
            ->orderByDesc('published_at')
            ->orderByDesc('updated_at');
    }

    protected static function booted()
    {
        parent::booted();

        static::creating(function ($announcement) {
            if (empty($announcement->slug)) {
                $announcement->slug = static::makeUniqueSlug($announcement->title);
            }
        });
    }

    public static function makeUniqueSlug(string $value, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($value);
        $slug = $baseSlug !== '' ? $baseSlug : 'berita';
        $suffix = 1;

        while (
            static::query()
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = sprintf('%s-%d', $baseSlug !== '' ? $baseSlug : 'berita', $suffix);
            $suffix++;
        }

        return $slug;
    }

    public function getPublicationStatusAttribute(): string
    {
        if (! $this->is_active) {
            return 'draft';
        }

        if ($this->published_at && $this->published_at->isFuture()) {
            return 'scheduled';
        }

        return 'published';
    }

    public function getExcerptTextAttribute(): string
    {
        if (filled($this->excerpt)) {
            return (string) $this->excerpt;
        }

        return Str::limit(
            trim(preg_replace('/\s+/', ' ', strip_tags((string) $this->content))),
            220
        );
    }

    public function getWordCountAttribute(): int
    {
        $plainText = trim(preg_replace('/\s+/u', ' ', strip_tags((string) $this->content)));

        if ($plainText === '') {
            return 0;
        }

        return count(preg_split('/\s+/u', $plainText) ?: []);
    }

    public function getReadingTimeMinutesAttribute(): int
    {
        return max(1, (int) ceil($this->word_count / 180));
    }
}
