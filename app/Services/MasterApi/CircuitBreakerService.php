<?php

declare(strict_types=1);

namespace App\Services\MasterApi;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CircuitBreakerService
{
    private int $threshold;

    private int $timeout;

    private string $key;

    public function __construct()
    {
        $this->threshold = (int) config('services.master_api.circuit_breaker_threshold', 5);
        $this->timeout = (int) config('services.master_api.circuit_breaker_timeout', 300);
        $this->key = 'master_api_circuit_breaker';
    }

    public function isOpen(): bool
    {
        $failures = (int) Cache::get($this->key, 0);
        $lastFailure = Cache::get($this->key.'_time');

        if ($failures >= $this->threshold) {
            if ($lastFailure && now()->timestamp - $lastFailure > $this->timeout) {
                Log::info('Circuit breaker: Half-open state, allowing test request');

                return false;
            }

            return true;
        }

        return false;
    }

    public function recordFailure(): void
    {
        $failures = (int) Cache::get($this->key, 0) + 1;

        Cache::put($this->key, $failures, $this->timeout * 2);
        Cache::put($this->key.'_time', now()->timestamp, $this->timeout * 2);

        if ($failures >= $this->threshold) {
            Log::warning("Circuit breaker: OPEN after {$failures} failures");
        }
    }

    public function recordSuccess(): void
    {
        Cache::put($this->key, 0, $this->timeout * 2);
        Log::debug('Circuit breaker: Success, resetting counter');
    }

    public function getStatus(): array
    {
        $failures = (int) Cache::get($this->key, 0);
        $lastFailure = Cache::get($this->key.'_time');

        return [
            'status' => $failures >= $this->threshold ? 'OPEN' : 'CLOSED',
            'failures' => $failures,
            'threshold' => $this->threshold,
            'timeout' => $this->timeout,
            'last_failure' => $lastFailure
                ? now()->createFromTimestamp($lastFailure)->toIso8601String()
                : null,
            'half_open_at' => $lastFailure
                ? now()->createFromTimestamp($lastFailure + $this->timeout)->toIso8601String()
                : null,
        ];
    }

    public function reset(): void
    {
        Cache::forget($this->key);
        Cache::forget($this->key.'_time');
    }
}
