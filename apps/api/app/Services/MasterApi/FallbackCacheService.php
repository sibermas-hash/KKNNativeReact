<?php

declare(strict_types=1);

namespace App\Services\MasterApi;

use Illuminate\Support\Facades\Cache;

class FallbackCacheService
{
    private string $prefix = 'master_api_fallback_';

    private string $tag = 'master_api_fallback';

    private int $ttlHours = 24;

    public function get(string $endpoint, array $params = []): array
    {
        $key = $this->getKey($endpoint, $params);

        return $this->cacheStore()->get($key, []);
    }

    public function store(string $endpoint, array $params, mixed $data): void
    {
        $key = $this->getKey($endpoint, $params);
        $this->cacheStore()->put($key, $data, now()->addHours($this->ttlHours));
    }

    public function forget(string $endpoint, array $params = []): void
    {
        $key = $this->getKey($endpoint, $params);
        $this->cacheStore()->forget($key);
    }

    public function flush(): void
    {
        if (Cache::supportsTags()) {
            Cache::tags([$this->tag])->flush();
        }
    }

    private function getKey(string $endpoint, array $params): string
    {
        $paramsHash = md5(json_encode($params));

        return $this->prefix.md5($endpoint).'_'.$paramsHash;
    }

    private function cacheStore()
    {
        return Cache::supportsTags()
            ? Cache::tags([$this->tag])
            : Cache::store();
    }
}
