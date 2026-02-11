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
        $this->baseUrl = rtrim((string) config('services.master_api.url', ''), '/');
        $this->clientId = (string) config('services.master_api.client_id', '');
        $this->clientSecret = (string) config('services.master_api.client_secret', '');
        $this->cacheMinutes = (int) config('services.master_api.cache_minutes', 60);
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
            } catch (\Exception $e) {
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
        $token = $this->getToken();

        if (!$token) {
            Log::error("Master API: No token available for GET {$endpoint}");
            return [];
        }

        try {
            $response = Http::withToken($token)
                ->withOptions(['verify' => $this->verifySsl])
                ->get($this->baseUrl . $endpoint, $params);

            Log::debug("Master API: GET {$endpoint} response", [
                'status' => $response->status(),
                'data_count' => count($response->json('data') ?? []),
            ]);

            if ($response->successful()) {
                return $response->json('data') ?? [];
            }

            Log::error("Master API: GET {$endpoint} failed", [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
        } catch (\Exception $e) {
            Log::error("Master API: GET {$endpoint} exception", ['error' => $e->getMessage()]);
        }

        return [];
    }

    /**
     * Fetch all organizations (Faculties)
     */
    public function getAllOrganizations(): array
    {
        return $this->get('/organizations', ['per_page' => 100]);
    }

    /**
     * Fetch all employees (Lecturers)
     */
    public function getAllEmployees(): array
    {
        return $this->get('/employees', ['per_page' => 500]);
    }

    /**
     * Fetch all students
     */
    public function getAllStudents(): array
    {
        return $this->get('/students', ['per_page' => 500]);
    }

    /**
     * Health check
     */
    public function healthCheck(): array
    {
        try {
            $response = Http::withOptions(['verify' => $this->verifySsl])->get($this->baseUrl . '/health');
            return $response->json() ?? ['status' => 'DOWN'];
        } catch (\Exception $e) {
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
