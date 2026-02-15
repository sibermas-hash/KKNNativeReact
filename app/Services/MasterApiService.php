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
        $this->baseUrl = rtrim((string)\App\Models\KKN\SystemSetting::get('master_api_url', config('services.master_api.url', '')), '/');
        $this->clientId = (string)\App\Models\KKN\SystemSetting::get('master_api_client_id', config('services.master_api.client_id', ''));
        $this->clientSecret = (string)\App\Models\KKN\SystemSetting::get('master_api_client_secret', config('services.master_api.client_secret', ''));
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
    protected function get(string $endpoint, array $params = []): array
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
                ->get($this->baseUrl . $endpoint, $params);

            Log::debug("Master API: GET {$endpoint} response", [
                'status' => $response->status(),
                'data_count' => count($response->json('data') ?? []),
                'page' => $params['page'] ?? null,
                'per_page' => $params['per_page'] ?? null,
            ]);

            if ($response->successful()) {
                return $response->json() ?? [];
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
     *
     * Master API caps per_page to 100, so clients must paginate.
     */
    protected function getAllPages(string $endpoint, array $params = [], int $perPage = 100, int $maxPages = 500): array
    {
        $perPage = min(max($perPage, 1), 100);

        $results = [];
        $page = 1;

        while (true) {
            $payload = $this->request($endpoint, array_merge($params, [
                'page' => $page,
                'per_page' => $perPage,
            ]));

            if (!is_array($payload) || !isset($payload['data']) || !is_array($payload['data'])) {
                Log::error('Master API: Pagination failed', [
                    'endpoint' => $endpoint,
                    'page' => $page,
                ]);
                return [];
            }

            $results = array_merge($results, $payload['data']);

            $pagination = $payload['meta']['pagination'] ?? null;
            $totalPages = is_array($pagination) ? ($pagination['total_pages'] ?? null) : null;

            if ($totalPages !== null) {
                $totalPages = (int)$totalPages;
                if ($totalPages <= 0) {
                    $totalPages = 1;
                }

                if ($page >= $totalPages) {
                    break;
                }
            }
            else {
                $next = (is_array($pagination) && isset($pagination['links']['next'])) ? $pagination['links']['next'] : null;
                if (empty($next)) {
                    // If API doesn't provide pagination meta, treat as single page.
                    break;
                }
            }

            $page++;
            if ($page > $maxPages) {
                Log::error('Master API: Pagination aborted (max pages exceeded)', [
                    'endpoint' => $endpoint,
                    'max_pages' => $maxPages,
                ]);
                break;
            }
        }

        return $results;
    }

    /**
     * Fetch all organizations (Faculties)
     */
    public function getAllOrganizations(): array
    {
        return $this->getAllPages('/organizations', [], 100);
    }

    /**
     * Fetch all employees (Lecturers)
     */
    public function getAllEmployees(): array
    {
        return $this->getAllPages('/employees', [], 100);
    }

    /**
     * Fetch all students
     */
    public function getAllStudents(): array
    {
        return $this->getAllPages('/students', [], 100);
    }

    /**
     * Health check
     */
    public function healthCheck(): array
    {
        try {
            $response = Http::withOptions(['verify' => $this->verifySsl])->get($this->baseUrl . '/health');
            $payload = $response->json() ?? [];

            // Backward compatible:
            // - old format: { "status": "UP", ... }
            // - new format: { "success": true, "data": { "status": "UP", ... }, ... }
            if (isset($payload['status'])) {
                return $payload;
            }

            if (isset($payload['data']) && is_array($payload['data']) && isset($payload['data']['status'])) {
                return $payload['data'];
            }

            return ['status' => $response->successful() ? 'UP' : 'DOWN'];
        }
        catch (\Exception $e) {
            return ['status' => 'DOWN', 'error' => $e->getMessage()];
        }
    }

    /**
     * Clear token cache
     */
    public function clearCache(): void
    {
        Cache::forget('master_api_token_' . $this->clientId);
    }
}