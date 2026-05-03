<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\KKN\Periode;
use App\Models\User;

class PeriodPolicy extends BasePolicy
{
    /**
     * Can the user view any periods?
     */
    public function viewAny(User $user): bool
    {
        return $this->superAdminBypass($user, 'viewAny')
            ?? $user->hasRole('superadmin');
    }

    /**
     * Can the user view a specific period's data?
     */
    public function view(User $user, Periode $period): bool
    {
        return $this->superAdminBypass($user, 'view')
            ?? $user->hasRole('superadmin');
    }

    /**
     * Can the user manage DPL assignments for this period?
     */
    public function manageDpl(User $user, Periode $period): bool
    {
        return $this->superAdminBypass($user, 'manageDpl')
            ?? $user->hasRole('superadmin');
    }

    /**
     * Can the user transfer students across periods?
     */
    public function transferStudents(User $user): bool
    {
        return $this->superAdminBypass($user, 'transferStudents')
            ?? $user->hasRole('superadmin');
    }

    /**
     * Can the user manage registrations for this period?
     */
    public function manageRegistrations(User $user, Periode $period): bool
    {
        return $this->superAdminBypass($user, 'manageRegistrations')
            ?? $user->hasRole('superadmin');
    }

    /**
     * Can the user view DPL dashboard for this period? (DPL role)
     */
    public function viewDplDashboard(User $user, Periode $period): bool
    {
        if ($bypassResult = $this->superAdminBypass($user, 'viewDplDashboard')) {
            return $bypassResult;
        }

        if (! $user->hasRole('dpl')) {
            return false;
        }

        // DPL can only view their assigned periods
        $dosen = $user->dosen;
        if (! $dosen) {
            return false;
        }

        return $dosen->dplPeriods()
            ->where('periode_id', $period->id)
            ->where('is_active', true)
            ->exists();
    }
}
