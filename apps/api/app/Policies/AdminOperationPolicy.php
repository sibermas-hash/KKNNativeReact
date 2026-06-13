<?php

declare(strict_types=1);

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
        $bypass = $this->superAdminBypass($user, 'manageMasterData');

        if ($bypass !== null) {
            return $bypass;
        }

        return $user->hasAnyRole(['admin', 'superadmin']);
    }

    public function viewMasterData(User $user): bool
    {
        return $user->hasAnyRole(['superadmin', 'admin', 'faculty_admin']);
    }

    public function manageGroups(User $user): bool
    {
        $bypass = $this->superAdminBypass($user, 'manageGroups');

        if ($bypass !== null) {
            return $bypass;
        }

        return $user->hasRole('admin');
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
        $bypass = $this->superAdminBypass($user, 'transferStudents');

        if ($bypass !== null) {
            return $bypass;
        }

        return $user->hasRole('admin');
    }

    public function manageParticipants(User $user): bool
    {
        $bypass = $this->superAdminBypass($user, 'manageParticipants');

        if ($bypass !== null) {
            return $bypass;
        }

        return $user->hasRole('admin');
    }

    /**
     * Read-only access to participant data (for faculty_admin).
     */
    public function viewParticipants(User $user): bool
    {
        return $user->hasAnyRole(['superadmin', 'admin', 'faculty_admin']);
    }

    public function manageUsers(User $user): bool
    {
        return $this->superAdminBypass($user, 'manageUsers') ?? false;
    }

    public function manageGrades(User $user): bool
    {
        $bypass = $this->superAdminBypass($user, 'manageGrades');

        if ($bypass !== null) {
            return $bypass;
        }

        return $user->hasRole('admin');
    }

    /**
     * Read-only access to grades/reports (for faculty_admin).
     */
    public function viewGrades(User $user): bool
    {
        return $user->hasAnyRole(['superadmin', 'admin', 'faculty_admin']);
    }

    public function manageContent(User $user): bool
    {
        $bypass = $this->superAdminBypass($user, 'manageContent');

        if ($bypass !== null) {
            return $bypass;
        }

        return $user->hasRole('admin');
    }

    public function viewAuditLogs(User $user): bool
    {
        return $this->superAdminBypass($user, 'viewAuditLogs') ?? false;
    }

    public function manageAnnouncements(User $user): bool
    {
        return $this->superAdminBypass($user, 'manageAnnouncements') ?? false;
    }

    public function manageDplAssignment(User $user): bool
    {
        $bypass = $this->superAdminBypass($user, 'manageDplAssignment');

        if ($bypass !== null) {
            return $bypass;
        }

        return $user->hasRole('admin');
    }

    public function manageReports(User $user): bool
    {
        return $user->hasAnyRole(['superadmin', 'admin', 'faculty_admin']);
    }

    public function manageKknOperations(User $user): bool
    {
        return $user->hasAnyRole(['superadmin', 'admin']);
    }

    public function manageEligibility(User $user): bool
    {
        return $user->hasAnyRole(['superadmin', 'admin', 'faculty_admin']);
    }

    public function manageRequirements(User $user): bool
    {
        return $user->hasAnyRole(['superadmin', 'admin']);
    }

    public function manageWorkshops(User $user): bool
    {
        return $user->hasAnyRole(['superadmin', 'admin']);
    }

    public function manageDatabaseSync(User $user): bool
    {
        return $this->superAdminBypass($user, 'manageDatabaseSync') ?? false;
    }
}
