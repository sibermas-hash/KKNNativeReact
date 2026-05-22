<?php

declare(strict_types=1);

namespace App\Observers;

use Illuminate\Support\Facades\Cache;

/**
 * Invalidates public endpoint caches when related models change.
 * Attach to Announcement, Download, Lokasi models in AppServiceProvider.
 */
class PublicCacheObserver
{
    public function saved($model): void
    {
        $this->flush($model);
    }

    public function deleted($model): void
    {
        $this->flush($model);
    }

    private function flush($model): void
    {
        $class = class_basename($model);

        match ($class) {
            'Announcement' => $this->flushAnnouncements($model),
            'Download' => Cache::forget('public:downloads'),
            'Lokasi' => $this->flushPattern('public:locations:*'),
            'KelompokKkn', 'PesertaKkn' => Cache::forget('public:home'),
            default => null,
        };

        Cache::forget('public:home');
    }

    private function flushAnnouncements($model): void
    {
        Cache::forget('public:popup');
        Cache::forget("public:announcement:{$model->slug}");
        $this->flushPattern('public:announcements:*');
    }

    private function flushPattern(string $pattern): void
    {
        $redis = Cache::getStore()->getRedis();
        $prefix = config('cache.prefix', 'laravel_cache') . ':';
        $cursor = null;

        do {
            [$cursor, $keys] = $redis->scan($cursor ?? 0, ['match' => $prefix . $pattern, 'count' => 100]);
            if (! empty($keys)) {
                $redis->del(...$keys);
            }
        } while ($cursor != 0);
    }
}
