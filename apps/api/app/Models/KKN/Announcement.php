<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Announcement extends Model
{
    use HasFactory;

    protected $table = 'announcements';

    public const CATEGORY_OPTIONS = [
        'PENGUMUMAN',
        'BERITA',
        'AGENDA',
        'PEDOMAN',
        'PRESS RELEASE',
        'KEMITRAAN',
    ];

    /**
     * Content-type partitioning.
     *
     * Satu tabel `announcements` menyimpan dua konsep yang secara UX berbeda:
     *   - "Pengumuman" — notifikasi formal (PENGUMUMAN)
     *   - "Berita"    — artikel / agenda / press-release / kemitraan / pedoman
     *
     * Setiap row di-klasifikasikan menurut `category`. Kedua array di bawah
     * menjadi sumber kebenaran untuk semua controller + scope. Kalau ada
     * kategori baru, tambahkan ke SALAH SATU array ini — jangan keduanya.
     */
    public const TYPE_PENGUMUMAN = 'pengumuman';

    public const TYPE_BERITA = 'berita';

    public const TYPE_PENGUMUMAN_CATEGORIES = ['PENGUMUMAN'];

    public const TYPE_BERITA_CATEGORIES = ['BERITA', 'AGENDA', 'PEDOMAN', 'PRESS RELEASE', 'KEMITRAAN'];

    public const TARGET_PUBLIC_HOME = 'public_home';

    public const TARGET_STUDENT_DASHBOARD = 'student_dashboard';

    public const TARGET_OPTIONS = [
        self::TARGET_PUBLIC_HOME,
        self::TARGET_STUDENT_DASHBOARD,
    ];

    /**
     * Resolve type dari kategori. Default fallback ke 'berita' supaya
     * kategori baru tidak accidentally bocor sebagai "pengumuman".
     */
    public static function resolveType(?string $category): string
    {
        $cat = strtoupper((string) $category);

        return in_array($cat, self::TYPE_PENGUMUMAN_CATEGORIES, true)
            ? self::TYPE_PENGUMUMAN
            : self::TYPE_BERITA;
    }

    public function getContentTypeAttribute(): string
    {
        return self::resolveType($this->category);
    }

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
        'show_as_popup',
        'popup_until',
        'popup_dismissable',
        'announcement_targets',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'published_at' => 'datetime',
        'show_as_popup' => 'boolean',
        'popup_until' => 'datetime',
        'popup_dismissable' => 'boolean',
        'announcement_targets' => 'array',
    ];

    public function scopeActive($query)
    {
        return $query
            ->where('is_active', true)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    /**
     * Filter by content-type (berita|pengumuman). No-op kalau $type kosong.
     */
    public function scopeOfType($query, ?string $type)
    {
        if (! $type) {
            return $query;
        }

        $normalized = strtolower($type);
        if ($normalized === self::TYPE_PENGUMUMAN) {
            return $query->whereIn('category', self::TYPE_PENGUMUMAN_CATEGORIES);
        }

        if ($normalized === self::TYPE_BERITA) {
            return $query->whereIn('category', self::TYPE_BERITA_CATEGORIES);
        }

        // Unknown type — biarkan query tidak ter-filter supaya tidak mengembalikan
        // hasil yang menyesatkan. Caller bisa validate lebih dulu kalau perlu.
        return $query;
    }

    public function scopeOrdered($query)
    {
        return $query
            ->orderByDesc('published_at')
            ->orderByDesc('updated_at');
    }

    /**
     * Announcements eligible to render as a popup on the public home page.
     * Must be active + published + flagged + not yet past popup_until.
     */
    public function scopeActivePopup($query)
    {
        return $query
            ->where('is_active', true)
            ->where('show_as_popup', true)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->where(function ($q) {
                $q->whereNull('popup_until')
                    ->orWhere('popup_until', '>=', now());
            });
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
