<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\SystemSetting;
use App\Traits\RetryWithBackoff;
use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Master API Service dengan Fallback & Retry Logic.
 *
 * Features:
 * - Retry dengan exponential backoff
 * - Circuit breaker pattern
 * - Fallback ke cached data
 * - Health check monitoring
 */
class MasterApiService
{
    use RetryWithBackoff;

    protected string $baseUrl;

    protected int $cacheMinutes;

    // Circuit breaker config
    protected int $circuitBreakerThreshold; // Failures before opening circuit

    protected int $circuitBreakerTimeout; // Seconds before half-open

    protected string $clientId;

    protected string $clientSecret;

    // Cache for fallback
    protected string $fallbackCachePrefix = 'master_api_fallback_';

    protected string $staticToken;

    protected bool $verifySsl;

    public function __construct()
    {
        $this->baseUrl = rtrim((string) $this->settingOrConfig('master_api_url', 'services.master_api.url', ''), '/');
        $this->clientId = (string) $this->settingOrConfig('master_api_client_id', 'services.master_api.client_id', '');
        $this->clientSecret = (string) $this->settingOrConfig('master_api_client_secret', 'services.master_api.client_secret', '');
        $this->staticToken = (string) $this->settingOrConfig('master_api_token', 'services.master_api.token', '');
        $this->cacheMinutes = max(5, (int) config('services.master_api.cache_minutes', 60));
        $this->verifySsl = config('app.env') !== 'local';

        // Circuit breaker config
        $this->circuitBreakerThreshold = (int) config('services.master_api.circuit_breaker_threshold', 5);
        $this->circuitBreakerTimeout = (int) config('services.master_api.circuit_breaker_timeout', 300);
    }

    /**
     * Clear all caches.
     */
    public function clearCache(): void
    {
        Cache::forget('master_api_token_'.$this->clientId);
        Cache::forget($this->getCircuitBreakerKey());
        Cache::forget($this->getCircuitBreakerKey().'_time');

        // Clear fallback cache (pattern matching)
        // Note: This requires Redis or file driver that supports tags
        if (Cache::supportsTags()) {
            Cache::tags(['master_api_fallback'])->flush();
        }
    }

    /**
     * GET request dengan retry dan fallback.
     */
    public function get(string $endpoint, array $params = []): array
    {
        // Check circuit breaker
        if ($this->isCircuitOpen()) {
            Log::warning('Master API: Circuit breaker is OPEN, using fallback', [
                'endpoint' => $endpoint,
            ]);

            return $this->getFromFallbackCache($endpoint, $params);
        }

        try {
            $payload = $this->retry(fn () => $this->request($endpoint, $params), maxAttempts: 3, initialDelay: 300);

            if ($payload !== null) {
                $this->circuitBreakerSuccess();
                // Cache successful response for fallback
                $this->cacheForFallback($endpoint, $params, $payload);

                return \is_array($payload) ? ($payload['data'] ?? []) : [];
            }

            // Request failed but didn't throw exception
            $this->circuitBreakerFailure();

            return $this->getFromFallbackCache($endpoint, $params);
        } catch (Exception $e) {
            $this->circuitBreakerFailure();
            Log::error('Master API: GET request failed', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage(),
            ]);

            // Fallback ke cached data
            return $this->getFromFallbackCache($endpoint, $params);
        }
    }

    /**
     * Sync dosen dengan retry dan fallback.
     */
    public function getSyncDosen(?string $since = null): array
    {
        $params = $since ? ['since' => $since] : [];

        return $this->getAllPagesWithFallback('/sync/dosen', $params, 'dosen');
    }

    /**
     * Sync mahasiswa dengan retry dan fallback.
     */
    public function getSyncMahasiswa(?string $since = null): array
    {
        $params = $since ? ['since' => $since] : [];

        return $this->getAllPagesWithFallback('/sync/mahasiswa', $params, 'mahasiswa');
    }

    /**
     * Fetch specific students by NIM list.
     */
    public function getStudentsByNimList(array $nimList): array
    {
        if (empty($nimList)) {
            return [];
        }

        return $this->get('/sync/mahasiswa', ['nims' => $nimList]);
    }

    /**
     * Fetch specific employees by NIP list.
     */
    public function getEmployeesByNipList(array $nipList): array
    {
        if (empty($nipList)) {
            return [];
        }

        return $this->get('/sync/dosen', ['nips' => $nipList]);
    }

    /**
     * Get JWT Token from Master API dengan retry.
     */
    public function getToken(): ?string
    {
        if ($this->staticToken !== '') {
            return $this->staticToken;
        }

        $cacheKey = 'master_api_token_'.$this->clientId;

        return Cache::remember($cacheKey, now()->addMinutes($this->cacheMinutes - 5), function () {
            try {
                return $this->retry(function () {
                    $response = Http::withOptions(['verify' => $this->verifySsl])
                        ->timeout(30)
                        ->post($this->baseUrl.'/auth/token', [
                            'client_id' => $this->clientId,
                            'client_secret' => $this->clientSecret,
                            'scope' => 'sync:read',
                        ]);

                    if ($response->successful()) {
                        $this->circuitBreakerSuccess();

                        return $response->json('data.access_token');
                    }

                    $this->circuitBreakerFailure();
                    Log::error('Master API: Failed to get token', [
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);
                }, maxAttempts: 3, initialDelay: 200);
            } catch (Exception $e) {
                $this->circuitBreakerFailure();
                Log::error('Master API: Connection error', ['error' => $e->getMessage()]);

                // Fallback: return cached token if available
                return Cache::get($cacheKey.'_fallback');
            }
        });
    }

    /**
     * GET request dengan fallback ke local database.
     */
    public function getWithDatabaseFallback(string $entityType, array $params = []): array
    {
        $apiData = $this->get($this->mapEntityTypeToEndpoint($entityType), $params);

        // Jika API gagal, fallback ke database lokal
        if (empty($apiData) && $this->isCircuitOpen()) {
            Log::info("Using database fallback for {$entityType}");

            return $this->getFromLocalDatabase($entityType, $params);
        }

        return $apiData;
    }

    /**
     * Health check dengan circuit breaker status.
     */
    public function healthCheck(): array
    {
        $circuitStatus = $this->getCircuitBreakerStatus();

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

    /**
     * Cache response for fallback.
     */
    protected function cacheForFallback(string $endpoint, array $params, mixed $data): void
    {
        $key = $this->getFallbackCacheKey($endpoint, $params);
        Cache::put($key, $data, now()->addHours(24));
    }

    /**
     * Circuit Breaker: Record failure.
     */
    protected function circuitBreakerFailure(): void
    {
        $key = $this->getCircuitBreakerKey();
        $failures = (int) Cache::get($key, 0) + 1;

        Cache::put($key, $failures, $this->circuitBreakerTimeout * 2);
        Cache::put($key.'_time', now()->timestamp, $this->circuitBreakerTimeout * 2);

        if ($failures >= $this->circuitBreakerThreshold) {
            Log::warning("Circuit breaker: OPEN after {$failures} failures");
        }
    }

    /**
     * Circuit Breaker: Record success.
     */
    protected function circuitBreakerSuccess(): void
    {
        Cache::put($this->getCircuitBreakerKey(), 0, $this->circuitBreakerTimeout * 2);
        Log::debug('Circuit breaker: Success, resetting counter');
    }

    /**
     * Format models for API response compatibility.
     */
    protected function formatDosenForApi(\App\Models\KKN\Dosen $dosen): array
    {
        return [
            'nip' => $dosen->nip,
            'name' => $dosen->name,
            'faculty' => [
                'code' => $dosen->faculty?->code,
                'name' => $dosen->faculty?->name,
            ],
            'email' => $dosen->user?->email,
            'phone' => $dosen->phone,
            'updated_at' => $dosen->updated_at?->toIso8601String(),
        ];
    }

    protected function formatFacultyForApi(\App\Models\KKN\Fakultas $faculty): array
    {
        return [
            'code' => $faculty->code,
            'name' => $faculty->name,
            'updated_at' => $faculty->updated_at?->toIso8601String(),
        ];
    }

    protected function formatMahasiswaForApi(\App\Models\KKN\Mahasiswa $mhs): array
    {
        return [
            'nim' => $mhs->nim,
            'name' => $mhs->name,
            'faculty' => [
                'code' => $mhs->faculty?->code,
                'name' => $mhs->faculty?->name,
            ],
            'program' => [
                'code' => $mhs->program?->code,
                'name' => $mhs->program?->name,
            ],
            'batch_year' => $mhs->batch_year,
            'gpa' => $mhs->gpa,
            'sks_completed' => $mhs->sks_completed,
            'updated_at' => $mhs->updated_at?->toIso8601String(),
        ];
    }

    protected function formatProgramForApi(\App\Models\KKN\Program $program): array
    {
        return [
            'code' => $program->code,
            'name' => $program->name,
            'faculty' => [
                'code' => $program->faculty?->code,
                'name' => $program->faculty?->name,
            ],
            'updated_at' => $program->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Fetch all pages dengan retry logic.
     */
    protected function getAllPages(string $endpoint, array $params = [], int $perPage = 100): array
    {
        $results = [];
        $page = 1;
        $consecutiveFailures = 0;
        $maxConsecutiveFailures = 2;

        while (true) {
            try {
                $payload = $this->request($endpoint, array_merge($params, [
                    'page' => $page,
                    'per_page' => $perPage,
                ]));

                if (!$payload || !isset($payload['data'])) {
                    break;
                }

                $consecutiveFailures = 0; // Reset on success
                $results = array_merge($results, $payload['data']);

                // Check pagination meta
                $pagination = $payload['pagination'] ?? $payload['meta']['pagination'] ?? null;

                if (!$pagination) {
                    break;
                }

                $lastPage = $pagination['last_page'] ?? 1;

                if ($page >= $lastPage) {
                    break;
                }

                ++$page;
            } catch (Exception $e) {
                ++$consecutiveFailures;

                Log::warning("Page {$page} fetch failed", [
                    'error' => $e->getMessage(),
                    'consecutive_failures' => $consecutiveFailures,
                ]);

                if ($consecutiveFailures >= $maxConsecutiveFailures) {
                    Log::error('Too many consecutive failures, stopping pagination');
                    break;
                }

                // Retry this page with backoff
                usleep(500000); // 500ms delay
            }
        }

        return $results;
    }

    /**
     * Fetch all pages dengan fallback.
     */
    protected function getAllPagesWithFallback(string $endpoint, array $params = [], ?string $entityType = null): array
    {
        try {
            $results = $this->getAllPages($endpoint, $params);

            if (!empty($results)) {
                return $results;
            }
        } catch (Exception $e) {
            Log::warning("API fetch failed, using fallback for {$endpoint}", [
                'error' => $e->getMessage(),
            ]);
        }

        // Fallback ke database lokal jika entity type diketahui
        if ($entityType) {
            return $this->getFromLocalDatabase($entityType, $params);
        }

        return [];
    }

    /**
     * Get circuit breaker cache key.
     */
    protected function getCircuitBreakerKey(): string
    {
        return 'master_api_circuit_breaker_'.$this->baseUrl;
    }

    /**
     * Get circuit breaker status.
     */
    protected function getCircuitBreakerStatus(): array
    {
        $failures = (int) Cache::get($this->getCircuitBreakerKey(), 0);
        $lastFailure = Cache::get($this->getCircuitBreakerKey().'_time');

        return [
            'status' => $failures >= $this->circuitBreakerThreshold ? 'OPEN' : 'CLOSED',
            'failures' => $failures,
            'threshold' => $this->circuitBreakerThreshold,
            'timeout' => $this->circuitBreakerTimeout,
            'last_failure' => $lastFailure ? now()->createFromTimestamp($lastFailure)->toIso8601String() : null,
            'half_open_at' => $lastFailure ? now()->createFromTimestamp($lastFailure + $this->circuitBreakerTimeout)->toIso8601String() : null,
        ];
    }

    /**
     * Get fallback cache key.
     */
    protected function getFallbackCacheKey(string $endpoint, array $params): string
    {
        $paramsHash = md5(json_encode($params));

        return $this->fallbackCachePrefix.md5($endpoint).'_'.$paramsHash;
    }

    /**
     * Get from fallback cache.
     */
    protected function getFromFallbackCache(string $endpoint, array $params): array
    {
        $key = $this->getFallbackCacheKey($endpoint, $params);

        return Cache::get($key, []);
    }

    /**
     * Get from local database (fallback).
     */
    protected function getFromLocalDatabase(string $entityType, array $params = []): array
    {
        try {
            return match ($entityType) {
                'dosen' => \App\Models\KKN\Dosen::with('user', 'faculty')
                    ->when(isset($params['since']), static fn ($q) => $q->where('updated_at', '>=', $params['since']))
                    ->get()
                    ->map(fn ($d) => $this->formatDosenForApi($d))
                    ->toArray(),

                'mahasiswa' => \App\Models\KKN\Mahasiswa::with('user', 'faculty', 'program')
                    ->when(isset($params['since']), static fn ($q) => $q->where('updated_at', '>=', $params['since']))
                    ->get()
                    ->map(fn ($m) => $this->formatMahasiswaForApi($m))
                    ->toArray(),

                'faculty' => \App\Models\KKN\Fakultas::all()
                    ->map(fn ($f) => $this->formatFacultyForApi($f))
                    ->toArray(),

                'program' => \App\Models\KKN\Program::with('faculty')
                    ->get()
                    ->map(fn ($p) => $this->formatProgramForApi($p))
                    ->toArray(),

                default => [],
            };
        } catch (Exception $e) {
            Log::error("Database fallback failed for {$entityType}", [
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Circuit Breaker: Check if circuit is open.
     */
    protected function isCircuitOpen(): bool
    {
        $failures = (int) Cache::get($this->getCircuitBreakerKey(), 0);
        $lastFailure = Cache::get($this->getCircuitBreakerKey().'_time');

        if ($failures >= $this->circuitBreakerThreshold) {
            // Check if timeout has passed (half-open state)
            if ($lastFailure && now()->timestamp - $lastFailure > $this->circuitBreakerTimeout) {
                Log::info('Circuit breaker: Half-open state, allowing test request');

                return false;
            }

            return true;
        }

        return false;
    }

    /**
     * Map entity type to API endpoint.
     */
    protected function mapEntityTypeToEndpoint(string $entityType): string
    {
        return match ($entityType) {
            'dosen' => '/sync/dosen',
            'mahasiswa' => '/sync/mahasiswa',
            'faculty' => '/organizations',
            'program' => '/programs',
            default => '/sync/'.$entityType,
        };
    }

    protected function request(string $endpoint, array $params = []): ?array
    {
        $token = $this->getToken();

        if (!$token) {
            Log::error("Master API: No token available for GET {$endpoint}");

            return null;
        }

        $response = Http::withToken($token)
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

    private function containsOnlyRequestedNims(array $students, array $nimList): bool
    {
        $lookup = array_flip($nimList);
        foreach ($students as $student) {
            $nim = trim((string) ($student['nim'] ?? ''));
            if ($nim === '' || !isset($lookup[$nim])) {
                return false;
            }
        }

        return true;
    }

    private function containsOnlyRequestedNips(array $employees, array $nipList): bool
    {
        $lookup = array_flip($nipList);
        foreach ($employees as $employee) {
            $nip = trim((string) ($employee['nip'] ?? ''));
            if ($nip === '' || !isset($lookup[$nip])) {
                return false;
            }
        }

        return true;
    }

    private function deduplicateEmployees(array $employees): array
    {
        $seen = [];
        $deduplicated = [];
        foreach ($employees as $employee) {
            $nip = trim((string) ($employee['nip'] ?? ''));
            if ($nip === '' || isset($seen[$nip])) {
                continue;
            }
            $seen[$nip] = true;
            $deduplicated[] = $employee;
        }

        return $deduplicated;
    }

    private function deduplicateStudents(array $students): array
    {
        $seen = [];
        $deduplicated = [];
        foreach ($students as $student) {
            $nim = trim((string) ($student['nim'] ?? ''));
            if ($nim === '' || isset($seen[$nim])) {
                continue;
            }
            $seen[$nim] = true;
            $deduplicated[] = $student;
        }

        return $deduplicated;
    }

    private function filterEmployeesByNipList(array $employees, array $nipList): array
    {
        $lookup = array_flip($nipList);

        return $this->deduplicateEmployees(array_values(array_filter($employees, static function ($employee) use ($lookup) {
            $nip = trim((string) ($employee['nip'] ?? ''));

            return $nip !== '' && isset($lookup[$nip]);
        })));
    }

    private function filterStudentsByNimList(array $students, array $nimList): array
    {
        $lookup = array_flip($nimList);

        return $this->deduplicateStudents(array_values(array_filter($students, static function ($student) use ($lookup) {
            $nim = trim((string) ($student['nim'] ?? ''));

            return $nim !== '' && isset($lookup[$nim]);
        })));
    }

    private function settingOrConfig(string $settingKey, string $configKey, mixed $default = null): mixed
    {
        $settingValue = SystemSetting::get($settingKey);

        if ($settingValue !== null && $settingValue !== '') {
            return $settingValue;
        }

        return config($configKey, $default);
    }
}
