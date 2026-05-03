<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\KKN\LogAudit;
use App\Models\User;

class AuditLogPolicy extends BasePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('superadmin');
    }

    public function view(User $user, LogAudit $log): bool
    {
        return $user->hasRole('superadmin');
    }

    public function delete(User $user, LogAudit $log): bool
    {
        return false; // Immutable logs, strict compliance
    }

    public function export(User $user): bool
    {
        return $user->hasRole('superadmin');
    }
}
