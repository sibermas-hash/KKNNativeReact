<?php

namespace App\Services;

use App\Models\KKN\SystemSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class MasterApiService
{
    protected string $baseUrl;
    protected string $clientId;
    protected string $clientSecret;
    protected string $staticToken;
    protected int $cacheMinutes;
    protected bool $verifySsl;

    public function __construct()
    {
        $this->baseUrl = rtrim((string) $this->settingOrConfig('master_api_url', 'services.master_api.url', ''), '/');
        $this->clientId = (string) $this->settingOrConfig('master_api_client_id', 'services.master_api.client_id', '');
        $this->clientSecret = (string) $this->settingOrConfig('master_api_client_secret', 'services.master_api.client_secret', '');
        $this->staticToken = (string) $this->settingOrConfig('master_api_token', 'services.master_api.token', '');
        $this->cacheMinutes = max(5, (int) config('services.master_api.cache_minutes', 60));
        $this->verifySsl = config('app.env') !== 'local';
    }

    /**
     * Get JWT Token from Master API
     */
    public function getToken(): ?string
    {
        if ($this->staticToken !== '') {
            return $this->staticToken;
        }

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
    public function getSyncDosen(?string $since = null): array
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
    public function getSyncMahasiswa(?string $since = null): array
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
     * Fetch employees for a specific list of NIP.
     */
    public function getEmployeesByNipList(array $nipList): array
    {
        $normalized = collect($nipList)
            ->map(static fn ($nip) => trim((string) $nip))
            ->filter()
            ->unique()
            ->values()
            ->all();

        if ($normalized === []) {
            return [];
        }

        $filtered = $this->getAllPages('/sync/dosen', [
            'nip_list' => implode(',', $normalized),
        ]);

        if ($filtered !== [] && $this->containsOnlyRequestedNips($filtered, $normalized)) {
            return $this->deduplicateEmployees($filtered);
        }

        return $this->filterEmployeesByNipList($this->getAllEmployees(), $normalized);
    }

    /**
     * Fetch all students for student sync.
     */
    public function getAllStudents(): array
    {
        return $this->getAllPages('/sync/mahasiswa');
    }

    /**
     * Fetch students for a specific list of NIM.
     */
    public function getStudentsByNimList(array $nimList): array
    {
        $normalized = collect($nimList)
            ->map(static fn ($nim) => trim((string) $nim))
            ->filter()
            ->unique()
            ->values()
            ->all();

        if ($normalized === []) {
            return [];
        }

        $filtered = $this->getAllPages('/sync/mahasiswa', [
            'nim_list' => implode(',', $normalized),
        ]);

        if ($filtered !== [] && $this->containsOnlyRequestedNims($filtered, $normalized)) {
            return $this->deduplicateStudents($filtered);
        }

        return $this->filterStudentsByNimList($this->getAllStudents(), $normalized);
    }

    /**
     * Fetch all organizations (Faculties)
     */
    public function getAllOrganizations(): array
    {
        return $this->getAllPages('/organizations', [], 100);
    }

    /**
     * Get groups from Master API (stub for local development)
     */
    public function getGroups(): array
    {
        // Return empty for local development (not using master API)
        return [];
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

    private function settingOrConfig(string $settingKey, string $configKey, mixed $default = null): mixed
    {
        $settingValue = SystemSetting::get($settingKey);

        if ($settingValue !== null && $settingValue !== '') {
            return $settingValue;
        }

        return config($configKey, $default);
    }

    private function containsOnlyRequestedNims(array $students, array $nimList): bool
    {
        $lookup = array_flip($nimList);

        foreach ($students as $student) {
            $nim = trim((string) ($student['nim'] ?? ''));

            if ($nim === '' || ! isset($lookup[$nim])) {
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

            if ($nip === '' || ! isset($lookup[$nip])) {
                return false;
            }
        }

        return true;
    }

    private function filterStudentsByNimList(array $students, array $nimList): array
    {
        $lookup = array_flip($nimList);

        return $this->deduplicateStudents(array_values(array_filter($students, static function ($student) use ($lookup) {
            $nim = trim((string) ($student['nim'] ?? ''));

            return $nim !== '' && isset($lookup[$nim]);
        })));
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
}
