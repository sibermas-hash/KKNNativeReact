<?php

declare(strict_types=1);

namespace App\Services\MasterApi;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MasterApiClient
{
    private string $baseUrl;

    private string $token;

    private bool $verifySsl;

    public function __construct(
        private readonly CircuitBreakerService $circuitBreaker,
        private readonly FallbackCacheService $fallbackCache,
    ) {
        $this->baseUrl = rtrim((string) config('services.master_api.url', ''), '/');
        $this->verifySsl = config('app.env') !== 'local';
        $this->token = '';
    }

    public function setToken(string $token): void
    {
        $this->token = $token;
    }

    public function get(string $endpoint, array $params = []): ?array
    {
        if ($this->circuitBreaker->isOpen()) {
            Log::warning('Master API: Circuit breaker is OPEN, using fallback', [
                'endpoint' => $endpoint,
            ]);

            return $this->fallbackCache->get($endpoint, $params);
        }

        try {
            $payload = $this->request($endpoint, $params);

            if ($payload !== null) {
                $this->circuitBreaker->recordSuccess();
                $this->fallbackCache->store($endpoint, $params, $payload);

                return $payload;
            }

            $this->circuitBreaker->recordFailure();

            return $this->fallbackCache->get($endpoint, $params);
        } catch (Exception $e) {
            $this->circuitBreaker->recordFailure();
            Log::error('Master API: GET request failed', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage(),
            ]);

            return $this->fallbackCache->get($endpoint, $params);
        }
    }

    public function getAllPages(string $endpoint, array $params = [], int $perPage = 100): array
    {
        $results = [];
        foreach ($this->yieldAllPages($endpoint, $params, $perPage) as $item) {
            $results[] = $item;
        }

        return $results;
    }

    /**
     * Memory-efficient way to fetch all pages sequentially.
     * Replaces array_merge heap issues with Generator patterns.
     */
    public function yieldAllPages(string $endpoint, array $params = [], int $perPage = 100): \Generator
    {
        $page = 1;
        $consecutiveFailures = 0;
        $maxConsecutiveFailures = 2;

        while (true) {
            try {
                $payload = $this->request($endpoint, array_merge($params, [
                    'page' => $page,
                    'per_page' => $perPage,
                ]));

                if (! $payload || ! isset($payload['data']) || ! \is_array($payload['data'])) {
                    break;
                }

                $consecutiveFailures = 0;
                
                foreach ($payload['data'] as $item) {
                    yield $item;
                }

                $pagination = $payload['pagination'] ?? $payload['meta']['pagination'] ?? null;
                if (! $pagination) {
                    break;
                }

                $lastPage = $pagination['last_page'] ?? 1;
                if ($page >= $lastPage) {
                    break;
                }

                $page++;
            } catch (Exception $e) {
                $consecutiveFailures++;
                Log::warning("Page {$page} fetch failed", [
                    'error' => $e->getMessage(),
                    'consecutive_failures' => $consecutiveFailures,
                ]);

                if ($consecutiveFailures >= $maxConsecutiveFailures) {
                    Log::error('Too many consecutive failures, stopping pagination');
                    break;
                }

                usleep(500000);
            }
        }
    }

    public function healthCheck(): array
    {
        $circuitStatus = $this->circuitBreaker->getStatus();

        try {
            $response = Http::withOptions(['verify' => $this->verifySsl])
                ->timeout(10)
                ->get($this->baseUrl.'/health');

            $data = $response->json();

            if (isset($data['success']) && $data['success'] && isset($data['data']['status'])) {
                return array_merge($data['data'], [
                    'circuit_breaker' => $circuitStatus,
                    'reachable' => true,
                ]);
            }

            if (isset($data['status'])) {
                return array_merge($data, [
                    'circuit_breaker' => $circuitStatus,
                    'reachable' => true,
                ]);
            }

            return [
                'status' => 'DOWN',
                'error' => 'Invalid response format',
                'circuit_breaker' => $circuitStatus,
                'reachable' => true,
            ];
        } catch (Exception $e) {
            return [
                'status' => 'DOWN',
                'error' => $e->getMessage(),
                'circuit_breaker' => $circuitStatus,
                'reachable' => false,
            ];
        }
    }

    private function request(string $endpoint, array $params = []): ?array
    {
        if (! $this->token) {
            Log::error("Master API: No token available for GET {$endpoint}");

            return null;
        }

        $response = Http::withToken($this->token)
            ->withOptions(['verify' => $this->verifySsl])
            ->timeout(30)
            ->get($this->baseUrl.$endpoint, $params);

        if ($response->successful()) {
            return $response->json();
        }

        Log::error("Master API: GET {$endpoint} failed", [
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }
}
