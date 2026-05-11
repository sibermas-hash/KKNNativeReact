<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\UserActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * ActivityLogger — service untuk mencatat aktivitas user ke `user_activity_logs`.
 *
 * Usage (static untuk kesederhanaan):
 *   ActivityLogger::log('login', 'success', $user->id);
 *   ActivityLogger::log('login', 'failed', null, ['attempted_username' => 'foo']);
 *
 * Desain: fire-and-forget. Kegagalan insert activity log TIDAK BOLEH
 * mematahkan request user (misal: login tetap sukses walau log gagal).
 */
class ActivityLogger
{
    /** @var list<string> */
    public const KNOWN_ACTIONS = [
        'login',
        'logout',
        'password_change',
        'password_reset',
        'profile_update',
        'avatar_upload',
        'avatar_rejected',
        'registration',
        'ai_playground',
        'pii_export',       // R11: PII export audit trail (biodata/bpjs/document)
        '2fa_verify',       // R11: 2FA flow events
        '2fa_enable',
        '2fa_disable',
    ];

    /**
     * Log user activity. Non-throwing — errors swallowed + logged to Laravel log.
     *
     * @param  array<string, mixed>  $metadata
     */
    public static function log(
        string $action,
        string $status = 'success',
        ?int $userId = null,
        array $metadata = []
    ): void {
        try {
            $request = request();

            UserActivityLog::create([
                'user_id' => $userId ?? Auth::id(),
                'action' => $action,
                'status' => $status,
                'metadata' => $metadata ?: null,
                'ip_address' => $request?->ip(),
                'user_agent' => mb_substr((string) ($request?->userAgent() ?? ''), 0, 500) ?: null,
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('ActivityLogger failed to persist', [
                'action' => $action,
                'status' => $status,
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
