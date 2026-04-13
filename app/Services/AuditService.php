<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditService
{
    /**
     * Log an administrative intervention or critical action
     */
    public static function log(string $action, string $description, $model = null, ?array $oldValues = null, ?array $newValues = null, ?int $userId = null)
    {
        $data = [
            'user_id' => $userId ?? Auth::id(),
            'action' => $action,
            'description' => $description,
            'model_type' => $model ? get_class($model) : null,
            'model_id' => $model ? $model->id : null,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'severity' => self::determineSeverity($action),
        ];

        try {
            \App\Jobs\ProcessAuditLog::dispatch($data);
            return true;
        } catch (\Throwable $e) {
            // Fallback to direct logging to storage if queue is down
            \Log::warning('Failed to dispatch AuditLog job. Falling back to direct DB record.', [
                'action' => $action,
                'error' => $e->getMessage()
            ]);

            try {
                \App\Models\KKN\LogAudit::create($data);
                return true;
            } catch (\Throwable $dbError) {
                \Log::error('Critical: Failed to even record AuditLog to DB.', [
                    'error' => $dbError->getMessage()
                ]);
                return false;
            }
        }
    }

    /**
     * Specialized log for Superadmin/God Mode bypass detections
     */
    public static function logGodModeAccess(\App\Models\User $user, string $target)
    {
        return self::log(
            'GATE_BYPASS_GOD_MODE',
            "Superadmin [{$user->name}] mengakses kemampuan sensitif: {$target}",
            null,
            ['user_id' => $user->id, 'ability' => $target],
            null,
            $user->id
        );
    }

    private static function determineSeverity(string $action): string
    {
        $high = ['DELETE', 'FORCE_FINALIZE', 'UPDATE_SCORE_ADMIN', 'BYPASS_POLICY', 'MASS_FINALIZE', 'GATE_BYPASS'];
        $medium = ['UPDATE', 'APPROVAL', 'REJECTION'];

        $actionUpper = strtoupper($action);
        foreach ($high as $h) {
            if (str_contains($actionUpper, $h)) {
                return 'high';
            }
        }
        foreach ($medium as $m) {
            if (str_contains($actionUpper, $m)) {
                return 'medium';
            }
        }

        return 'low';
    }
}
