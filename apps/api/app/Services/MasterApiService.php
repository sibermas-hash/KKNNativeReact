<?php

declare(strict_types=1);

namespace App\Services;

use App\Services\MasterApi\CircuitBreakerService;
use App\Services\MasterApi\EntityMapperService;
use App\Services\MasterApi\FallbackCacheService;
use App\Services\MasterApi\MasterApiClient;
use App\Services\MasterApi\MasterApiTokenService;
use Exception;
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

        // Audit sync finding S-2: SIAKAD's `/sync/mahasiswa?nims[]=...` filter
        // is not honored server-side — the endpoint returns the first page of
        // all students regardless. We stream the full list and filter locally,
        // stopping early once every requested NIM has been found.
        return $this->filterFromStream(
            $this->yieldSyncMahasiswa(),
            'nim',
            $nimList
        );
    }

    public function getEmployeesByNipList(array $nipList): array
    {
        if (empty($nipList)) {
            return [];
        }

        // See S-2 note above — same SIAKAD API defect for the dosen endpoint.
        return $this->filterFromStream(
            $this->yieldSyncDosen(),
            'nip',
            $nipList
        );
    }

    /**
     * S-2 helper: filter a streamed sync endpoint client-side.
     * Stops early once every needle has been matched.
     */
    private function filterFromStream(\Generator $stream, string $keyField, array $needleValues): array
    {
        $needles = array_flip(array_map('strval', $needleValues));
        $matched = [];

        foreach ($stream as $record) {
            $val = (string) ($record[$keyField] ?? '');
            if ($val !== '' && isset($needles[$val])) {
                $matched[] = $record;
                unset($needles[$val]);
                if (empty($needles)) {
                    break; // every requested id found — no need to stream further
                }
            }
        }

        if (! empty($needles)) {
            Log::info('MasterApi client-side filter: some ids not found', [
                'field' => $keyField,
                'missing' => array_keys($needles),
            ]);
        }

        return $matched;
    }

    public function getAllOrganizations(?string $since = null): array
    {
        $params = $since ? ['since' => $since] : [];

        return $this->getAllPagesWithFallback('/sync/organizations', $params, 'organizations');
    }

    public function getAllPrograms(?string $since = null): array
    {
        $params = $since ? ['since' => $since] : [];

        return $this->getAllPagesWithFallback('/programs', $params, 'program');
    }

    public function yieldAllOrganizations(?string $since = null): \Generator
    {
        $params = $since ? ['since' => $since] : [];
        $this->client->setToken($this->tokenService->getToken() ?? '');

        return $this->client->yieldAllPages('/sync/organizations', $params);
    }

    public function yieldAllPrograms(?string $since = null): \Generator
    {
        $params = $since ? ['since' => $since] : [];
        $this->client->setToken($this->tokenService->getToken() ?? '');

        return $this->client->yieldAllPages('/programs', $params);
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
