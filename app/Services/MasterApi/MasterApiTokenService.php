<?php

declare(strict_types=1);

namespace App\Services\MasterApi;

use App\Models\KKN\SystemSetting;
use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MasterApiTokenService
{
    private string $clientId;

    private string $clientSecret;

    private string $staticToken;

    private bool $verifySsl;

    private string $baseUrl;

    private int $cacheMinutes;

    private int $timeoutSeconds;

    public function __construct()
    {
        // Priority: SystemSetting (admin UI) → config/env fallback
        $this->baseUrl = rtrim(
            (string) (SystemSetting::get('master_api_url') ?: config('services.master_api.url', '')),
            '/'
        );
        $this->clientId = (string) (SystemSetting::get('master_api_client_id') ?: config('services.master_api.client_id', ''));
        $this->clientSecret = (string) (SystemSetting::get('master_api_client_secret') ?: config('services.master_api.client_secret', ''));
        $this->staticToken = (string) (SystemSetting::get('master_api_token') ?: config('services.master_api.token', ''));
        $this->verifySsl = config('app.env') !== 'local';
        $this->timeoutSeconds = max(5, (int) config('services.master_api.timeout', 30));
        $this->cacheMinutes = max(5, (int) config('services.master_api.cache_minutes', 60));
    }

    public function getToken(): ?string
    {
        if ($this->staticToken !== '') {
            return $this->staticToken;
        }

        $cacheKey = 'master_api_token_'.$this->clientId;

        return Cache::remember($cacheKey, now()->addMinutes($this->cacheMinutes - 5), function () use ($cacheKey) {
            try {
                $token = $this->fetchToken();

                if ($token) {
                    Cache::put($cacheKey.'_fallback', $token, now()->addMinutes($this->cacheMinutes));

                    return $token;
                }
            } catch (Exception $e) {
                Log::error('Master API: Connection error', ['error' => $e->getMessage()]);
            }

            return Cache::get($cacheKey.'_fallback');
        });
    }

    private function fetchToken(): ?string
    {
        $response = Http::withOptions(['verify' => $this->verifySsl])
            ->timeout($this->timeoutSeconds)
            ->post($this->baseUrl.'/auth/token', [
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
                'scope' => 'sync:read',
            ]);

        if ($response->successful()) {
            return $response->json('data.access_token');
        }

        Log::error('Master API: Failed to get token', [
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        return null;
    }
}
