<?php

namespace App\Policies;

use App\Models\User;

/**
 * Policy for admin-only operations that don't have model-specific policies.
 * Provides defense-in-depth beyond route middleware.
 */
class AdminOperationPolicy extends BasePolicy
{
    public function manageMasterData(User $user): bool
    {
        return $this->superAdminBypass($user, 'manageMasterData') ?? false;
    }

    public function manageGroups(User $user): bool
    {
        return $this->superAdminBypass($user, 'manageGroups') ?? false;
    }

    public function manageSettings(User $user): bool
    {
        return $this->superAdminBypass($user, 'manageSettings') ?? false;
    }

    public function syncData(User $user): bool
    {
        return $this->superAdminBypass($user, 'syncData') ?? false;
    }

    public function transferStudents(User $user): bool
    {
        return $this->superAdminBypass($user, 'transferStudents') ?? false;
    }
}
