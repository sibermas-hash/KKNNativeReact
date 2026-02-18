<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class MasterApiService
{
    protected string $baseUrl;
    protected string $clientId;
    protected string $clientSecret;
    protected int $cacheMinutes;
    protected bool $verifySsl;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.master_api.url', ''), '/');
        $this->clientId = config('services.master_api.client_id', '');
        $this->clientSecret = config('services.master_api.client_secret', '');
        $this->cacheMinutes = (int)config('services.master_api.cache_minutes', 60);
        $this->verifySsl = config('app.env') !== 'local';
    }

    /**
     * Get JWT Token from Master API
     */
    public function getToken(): ?string
    {
        $cacheKey = 'master_api_token_' . $this->clientId;

        return Cache::remember($cacheKey, now()->addMinutes($this->cacheMinutes - 5), function () {
            try {
                $response = Http::withOptions(['verify' => $this->verifySsl])->post($this->baseUrl . '/auth/token', [
                    'client_id' => $this->clientId,
                    'client_secret' => $this->clientSecret,
                    'scope' => 'sync:read',
                ]);

                if ($response->successful()) {
                    return $response->json('data.access_token');
                }

                Log::error('Master API: Failed to get token', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
            }
            catch (\Exception $e) {
                Log::error('Master API: Connection error', ['error' => $e->getMessage()]);
            }

            return null;
        });
    }

    /**
     * Authenticated GET request
     */
    public function get(string $endpoint, array $params = []): array
    {
        $payload = $this->request($endpoint, $params);
        return is_array($payload) ? ($payload['data'] ?? []) : [];
    }

    /**
     * Authenticated GET request (raw JSON payload).
     */
    protected function request(string $endpoint, array $params = []): ?array
    {
        $token = $this->getToken();

        if (!$token) {
            Log::error("Master API: No token available for GET {$endpoint}");
            return null;
        }

        try {
            $response = Http::withToken($token)
                ->withOptions(['verify' => $this->verifySsl])
                ->timeout(30)
                ->get($this->baseUrl . $endpoint, $params);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error("Master API: GET {$endpoint} failed", [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
        }
        catch (\Exception $e) {
            Log::error("Master API: GET {$endpoint} exception", ['error' => $e->getMessage()]);
        }

        return null;
    }

    /**
     * Fetch all pages for a paginated Master API endpoint.
     */
    protected function getAllPages(string $endpoint, array $params = [], int $perPage = 100): array
    {
        $results = [];
        $page = 1;

        while (true) {
            $payload = $this->request($endpoint, array_merge($params, [
                'page' => $page,
                'per_page' => $perPage,
            ]));

            if (!$payload || !isset($payload['data'])) {
                break;
            }

            $currentData = $payload['data'];
            $results = array_merge($results, $currentData);

            // Check pagination meta
            $pagination = $payload['pagination'] ?? $payload['meta']['pagination'] ?? null;

            if (!$pagination) {
                // If no pagination meta, assume single page
                break;
            }

            $lastPage = $pagination['last_page'] ?? 1;

            if ($page >= $lastPage) {
                break;
            }

            $page++;
        }

        return $results;
    }

    /**
     * Fetch Dosen data for sync
     */
    public function getSyncDosen(string $since = null): array
    {
        $params = [];
        if ($since) {
            $params['since'] = $since;
        }
        return $this->getAllPages('/sync/dosen', $params);
    }

    /**
     * Fetch Mahasiswa data for sync
     */
    public function getSyncMahasiswa(string $since = null): array
    {
        $params = [];
        if ($since) {
            $params['since'] = $since;
        }
        return $this->getAllPages('/sync/mahasiswa', $params);
    }

    /**
     * Fetch all employees (lecturers) for DPL sync.
     */
    public function getAllEmployees(): array
    {
        return $this->getAllPages('/sync/dosen');
    }

    /**
     * Fetch all students for student sync.
     */
    public function getAllStudents(): array
    {
        return $this->getAllPages('/sync/mahasiswa');
    }

    /**
     * Fetch all organizations (Faculties)
     */
    public function getAllOrganizations(): array
    {
        return $this->getAllPages('/organizations', [], 100);
    }

    public function healthCheck(): array
    {
        try {
            $response = Http::withOptions(['verify' => $this->verifySsl])->get($this->baseUrl . '/health');
            $data = $response->json();

            if (isset($data['success']) && $data['success'] && isset($data['data']['status'])) {
                return $data['data'];
            }

            if (isset($data['status'])) {
                return $data;
            }

            return ['status' => 'DOWN', 'error' => 'Invalid response format'];
        }
        catch (\Exception $e) {
            return ['status' => 'DOWN', 'error' => $e->getMessage()];
        }
    }

    public function clearCache(): void
    {
        Cache::forget('master_api_token_' . $this->clientId);
    }
}