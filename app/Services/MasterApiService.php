<?php

declare(strict_types=1);

namespace App\Services;

use App\Services\MasterApi\CircuitBreakerService;
use App\Services\MasterApi\EntityMapperService;
use App\Services\MasterApi\FallbackCacheService;
use App\Services\MasterApi\MasterApiClient;
use App\Services\MasterApi\MasterApiTokenService;
use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Master API Service Facade.
 *
 * Refactored from 683 lines to a coordinating facade that uses smaller services:
 * - MasterApiClient: HTTP requests
 * - CircuitBreakerService: Circuit breaker pattern
 * - FallbackCacheService: Fallback caching
 * - EntityMapperService: Data mapping
 * - MasterApiTokenService: Token management
 */
class MasterApiService
{
    public function __construct(
        private readonly MasterApiClient $client,
        private readonly MasterApiTokenService $tokenService,
        private readonly CircuitBreakerService $circuitBreaker,
        private readonly FallbackCacheService $fallbackCache,
        private readonly EntityMapperService $mapper,
    ) {}

    public function clearCache(): void
    {
        Cache::forget('master_api_token_'.config('services.master_api.client_id'));
        $this->circuitBreaker->reset();
        $this->fallbackCache->flush();
    }

    public function get(string $endpoint, array $params = []): array
    {
        $this->client->setToken($this->tokenService->getToken() ?? '');
        $payload = $this->client->get($endpoint, $params);

        return \is_array($payload) ? ($payload['data'] ?? []) : [];
    }

    public function getSyncDosen(?string $since = null): array
    {
        $params = $since ? ['since' => $since] : [];

        return $this->getAllPagesWithFallback('/sync/dosen', $params, 'dosen');
    }

    public function getSyncMahasiswa(?string $since = null): array
    {
        $params = $since ? ['since' => $since] : [];

        return $this->getAllPagesWithFallback('/sync/mahasiswa', $params, 'mahasiswa');
    }

    public function yieldSyncMahasiswa(?string $since = null): \Generator
    {
        $params = $since ? ['since' => $since] : [];
        $this->client->setToken($this->tokenService->getToken() ?? '');

        return $this->client->yieldAllPages('/sync/mahasiswa', $params);
    }

    public function yieldSyncDosen(?string $since = null): \Generator
    {
        $params = $since ? ['since' => $since] : [];
        $this->client->setToken($this->tokenService->getToken() ?? '');

        return $this->client->yieldAllPages('/sync/dosen', $params);
    }

    public function getStudentsByNimList(array $nimList): array
    {
        if (empty($nimList)) {
            return [];
        }

        return $this->get('/sync/mahasiswa', ['nims' => $nimList]);
    }

    public function getEmployeesByNipList(array $nipList): array
    {
        if (empty($nipList)) {
            return [];
        }

        return $this->get('/sync/dosen', ['nips' => $nipList]);
    }

    public function getAllOrganizations(?string $since = null): array
    {
        $params = $since ? ['since' => $since] : [];

        return $this->getAllPagesWithFallback('/sync/organizations', $params, 'organizations');
    }

    public function yieldAllOrganizations(?string $since = null): \Generator
    {
        $params = $since ? ['since' => $since] : [];
        $this->client->setToken($this->tokenService->getToken() ?? '');

        return $this->client->yieldAllPages('/sync/organizations', $params);
    }

    public function getWithDatabaseFallback(string $entityType, array $params = []): array
    {
        $apiData = $this->get($this->mapper->mapEntityTypeToEndpoint($entityType), $params);

        if (empty($apiData) && $this->circuitBreaker->isOpen()) {
            Log::info("Using database fallback for {$entityType}");

            return $this->mapper->getFromDatabase($entityType, $params);
        }

        return $apiData;
    }

    public function healthCheck(): array
    {
        return $this->client->healthCheck();
    }

    private function getAllPagesWithFallback(string $endpoint, array $params = [], ?string $entityType = null): array
    {
        try {
            $this->client->setToken($this->tokenService->getToken() ?? '');
            $results = $this->client->getAllPages($endpoint, $params);

            if (! empty($results)) {
                return $results;
            }
        } catch (Exception $e) {
            Log::warning("API fetch failed, using fallback for {$endpoint}", [
                'error' => $e->getMessage(),
            ]);
        }

        if ($entityType) {
            return $this->mapper->getFromDatabase($entityType, $params);
        }

        return [];
    }
}
