<?php

declare(strict_types=1);

namespace App\Services\MasterApi;

use Illuminate\Support\Facades\Cache;

class FallbackCacheService
{
    private string $prefix = 'master_api_fallback_';

    private int $ttlHours = 24;

    public function get(string $endpoint, array $params = []): array
    {
        $key = $this->getKey($endpoint, $params);

        return Cache::get($key, []);
    }

    public function store(string $endpoint, array $params, mixed $data): void
    {
        $key = $this->getKey($endpoint, $params);
        Cache::put($key, $data, now()->addHours($this->ttlHours));
    }

    public function forget(string $endpoint, array $params = []): void
    {
        $key = $this->getKey($endpoint, $params);
        Cache::forget($key);
    }

    public function flush(): void
    {
        if (Cache::supportsTags()) {
            Cache::tags(['master_api_fallback'])->flush();
        }
    }

    private function getKey(string $endpoint, array $params): string
    {
        $paramsHash = md5(json_encode($params));

        return $this->prefix.md5($endpoint).'_'.$paramsHash;
    }
}
