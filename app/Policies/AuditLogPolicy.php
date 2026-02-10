<?php

namespace App\Policies;

use App\Models\User;
use App\Models\AuditLog;

class AuditLogPolicy extends BasePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('superadmin');
    }

    public function view(User $user, AuditLog $log): bool
    {
        return $user->hasRole('superadmin');
    }

    public function delete(User $user, AuditLog $log): bool
    {
        return false; // Immutable logs, strict compliance
    }

    public function export(User $user): bool
    {
        return $user->hasRole('superadmin');
    }
}
