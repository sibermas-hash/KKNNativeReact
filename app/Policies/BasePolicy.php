<?php

namespace App\Policies;

use App\Models\User;
use App\Services\AuditService;
use Illuminate\Auth\Access\HandlesAuthorization;

abstract class BasePolicy
{
    use HandlesAuthorization;

    /**
     * Superadmin bypass - logs audit via AuditService.
     * Returns true if authorized via bypass, null otherwise (to fall through to specific logic).
     */
    protected function superAdminBypass(User $user, string $ability): ?bool
    {
        if ($user->hasRole('superadmin')) {
            // Log access via AuditService
            AuditService::logGodModeAccess($user, static::class . '@' . $ability);
            return true;
        }
        return null; // Fallthrough
    }
}
