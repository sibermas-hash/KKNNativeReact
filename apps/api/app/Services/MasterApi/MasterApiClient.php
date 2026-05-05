<?php

declare(strict_types=1);

namespace App\Services\MasterApi;

use App\Models\KKN\SystemSetting;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MasterApiClient
{
    private string $baseUrl;

    private string $token;

    private bool $verifySsl;

    private int $timeoutSeconds;

    public function __construct(
        private readonly CircuitBreakerService $circuitBreaker,
        private readonly FallbackCacheService $fallbackCache,
    ) {
        // Priority: SystemSetting (admin UI) → config/env fallback
        $this->baseUrl = rtrim(
            (string) (SystemSetting::get('master_api_url') ?: config('services.master_api.url', '')),
            '/'
        );
        $this->verifySsl = config('app.env') !== 'local';
        $this->timeoutSeconds = max(5, (int) config('services.master_api.timeout', 30));
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
     *
     * Supports SIAKAD UIN Saizu response structure:
     * { "status": "success", "data": { "current_page": 1, "data": [...], "last_page": 50, ... } }
     *
     * Also supports legacy flat structure:
     * { "data": [...], "pagination": { "last_page": 50 } }
     */
    public function yieldAllPages(string $endpoint, array $params = [], int $perPage = 100): \Generator
    {
        $page = 1;
        $consecutiveFailures = 0;
        $maxConsecutiveFailures = 2;

        while (true) {
            try {
                $url = $this->baseUrl.$endpoint;
                Log::debug("API Request: GET {$url}", ['params' => array_merge($params, ['page' => $page])]);

                $payload = $this->request($endpoint, array_merge($params, [
                    'page' => $page,
                    'per_page' => $perPage,
                ]));

                if (! $payload) {
                    Log::warning("API Response: Empty payload for {$endpoint} page {$page}");
                    break;
                }

                Log::debug("API Response: Success for {$endpoint} page {$page}", [
                    'status' => $payload['status'] ?? 'unknown',
                    'has_data_key' => isset($payload['data']),
                    'data_is_array' => isset($payload['data']) && is_array($payload['data']),
                ]);

                // Format 1 — Laravel Resource Collection (SIAKAD aktual):
                // { "data": [...], "meta": { "current_page": 1, "last_page": N }, "links": {...} }
                if (isset($payload['data']) && \is_array($payload['data']) && isset($payload['meta']['last_page'])) {
                    $items = $payload['data'];
                    $lastPage = (int) $payload['meta']['last_page'];
                }
                // Format 2 — Nested SIAKAD (per panduan):
                // { "status": "success", "data": { "current_page": 1, "data": [...], "last_page": N } }
                elseif (isset($payload['data']['data']) && \is_array($payload['data']['data'])) {
                    $items = $payload['data']['data'];
                    $lastPage = (int) ($payload['data']['last_page'] ?? 1);
                }
                // Format 3 — Legacy flat:
                // { "data": [...], "pagination": { "last_page": N } }
                elseif (isset($payload['data']) && \is_array($payload['data'])) {
                    $items = $payload['data'];
                    $pagination = $payload['pagination'] ?? $payload['meta']['pagination'] ?? null;
                    $lastPage = $pagination ? (int) ($pagination['last_page'] ?? 1) : 1;
                } else {
                    break;
                }

                $consecutiveFailures = 0;

                foreach ($items as $item) {
                    yield $item;
                }

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
            // The health endpoint is at the root /api/health regardless of the sync prefix
            $domainUrl = preg_replace('/\/api$/', '', $this->baseUrl);
            $healthUrl = rtrim($domainUrl, '/') . '/api/health';

            // /api/health does not require authentication per SIAKAD API spec
            $response = Http::withHeaders(['Accept' => 'application/json'])
                ->withOptions(['verify' => $this->verifySsl])
                ->timeout(min(10, $this->timeoutSeconds))
                ->get($healthUrl);

            $data = $response->json();

            if (isset($data['status'])) {
                $status = strtoupper((string) $data['status']);
                if ($status === 'OK') {
                    $status = 'UP';
                }

                return array_merge($data, [
                    'status' => $status,
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

        // Accept: application/json is REQUIRED by SIAKAD API to prevent redirect to login page
        $response = Http::withToken($this->token)
            ->withHeaders(['Accept' => 'application/json'])
            ->withOptions(['verify' => $this->verifySsl])
            ->timeout($this->timeoutSeconds)
            ->get($this->baseUrl.$endpoint, $params);

        if ($response->successful()) {
            return $response->json();
        }

        Log::error("Master API: GET {$endpoint} failed", [
            'status' => $response->status(),
            'body' => $response->body(),
            'url' => $this->baseUrl.$endpoint,
            'token_exists' => !empty($this->token),
        ]);

        return null;
    }
}
