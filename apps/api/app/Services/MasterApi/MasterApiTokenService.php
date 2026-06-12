<?php

declare(strict_types=1);

namespace App\Services\MasterApi;

use App\Models\KKN\SystemSetting;
use Illuminate\Support\Facades\Log;

class MasterApiTokenService
{
    private string $staticToken;

    public function __construct()
    {
        // Priority: SystemSetting (admin UI) → config/env fallback
        $this->staticToken = (string) (SystemSetting::get('master_api_token') ?: config('services.master_api.token', ''));
    }

    public function getToken(): ?string
    {
        // SIAKAD API uses a static Bearer Token provided by the administrator.
        // No OAuth flow is needed. Token is configured via MASTER_API_TOKEN env var
        // or via the admin UI (SystemSetting 'master_api_token').
        if ($this->staticToken !== '') {
            return $this->staticToken;
        }

        Log::warning('Master API: No static token configured. Set MASTER_API_TOKEN in .env or via admin settings.');

        return null;
    }
}
