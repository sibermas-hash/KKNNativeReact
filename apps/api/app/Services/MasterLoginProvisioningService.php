<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class MasterLoginProvisioningService
{
    public function __construct(
        private readonly MasterApiService $masterApi,
        private readonly StudentSyncService $studentSync,
    ) {}

    public function provisionStudentForLogin(string $loginValue): bool
    {
        if (! (bool) config('services.master_api.auto_provision_login', false)) {
            return false;
        }

        $loginValue = trim($loginValue);
        if (! preg_match('/^\d{6,20}$/', $loginValue)) {
            return false;
        }

        $cooldownKey = "master-login-provision:student:{$loginValue}";
        if (Cache::has($cooldownKey)) {
            return false;
        }

        $cooldownSeconds = max(60, (int) config('services.master_api.auto_provision_cooldown_seconds', 900));
        Cache::put($cooldownKey, true, now()->addSeconds($cooldownSeconds));

        try {
            $studentData = $this->masterApi->getStudentsByNimList([$loginValue])[0] ?? null;
            if (! is_array($studentData)) {
                return false;
            }

            return $this->studentSync->upsertStudent($studentData, true, false);
        } catch (\Throwable $e) {
            Log::warning('Master login auto-provision failed', [
                'login' => $loginValue,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
