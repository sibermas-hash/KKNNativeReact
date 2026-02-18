<?php

namespace App\Services;

use App\Models\KKN\LogAudit;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditService
{
    /**
     * Log an administrative intervention or critical action
     */
    public static function log(string $action, string $description, $model = null, ?array $oldValues = null, ?array $newValues = null, ?int $userId = null)
    {
        return LogAudit::create([
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
        ]);
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
        $high = ['DELETE', 'FORCE_FINALIZE', 'UPDATE_SCORE_ADMIN', 'BYPASS_POLICY', 'MASS_FINALIZE'];
        $medium = ['UPDATE', 'APPROVAL', 'REJECTION'];

        $actionUpper = strtoupper($action);
        foreach ($high as $h) {
            if (str_contains($actionUpper, $h))
                return 'high';
        }
        foreach ($medium as $m) {
            if (str_contains($actionUpper, $m))
                return 'medium';
        }

        return 'low';
    }
}