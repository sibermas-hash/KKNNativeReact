<?php

namespace App\Policies;

use App\Models\User;
use App\Models\KKN\NilaiKkn;

class KknScorePolicy extends BasePolicy
{
    public function viewAny(User $user): bool
    {
        return $this->superAdminBypass($user, 'viewAny') ?? 
               $user->hasAnyRole(['superadmin', 'admin', 'dpl']);
    }

    public function view(User $user, NilaiKkn $score): bool
    {
        if ($bypass = $this->superAdminBypass($user, 'view')) return true;
        
        // DPL only views scores of their assigned group
        if ($user->hasRole('dpl')) {
            // Check via relationship chain: Score -> Group -> Lecturer -> User
            return $score->kelompok?->dosen?->user_id === $user->id;
        }
        
        // Student only views their own score
        if ($user->hasRole('student')) {
            return $score->mahasiswa_id === $user->id;
        }
        
        return $user->hasRole('admin');
    }

    public function create(User $user): bool
    {
        return $this->superAdminBypass($user, 'create') ?? 
               $user->hasAnyRole(['superadmin', 'admin', 'dpl']);
    }

    public function update(User $user, NilaiKkn $score): bool
    {
        if ($bypass = $this->superAdminBypass($user, 'update')) return true;
        
        // Cannot edit finalized scores (except superadmin)
        if ($score->is_finalized) {
            return false;
        }
        
        // Admin can update any non-finalized score
        if ($user->hasRole('admin')) {
            return true;
        }
        
        // DPL can update scores for their group
        if ($user->hasRole('dpl')) {
            return $score->kelompok?->dosen?->user_id === $user->id;
        }
        
        return false;
    }

    public function delete(User $user, NilaiKkn $score): bool
    {
        return $this->superAdminBypass($user, 'delete') ?? 
               ($user->hasRole('superadmin') && !$score->is_finalized);
    }

    public function finalize(User $user, NilaiKkn $score): bool
    {
        return $this->superAdminBypass($user, 'finalize') ?? 
               $user->hasAnyRole(['superadmin', 'admin']);
    }

    public function bulkFinalize(User $user): bool
    {
        return $this->superAdminBypass($user, 'bulkFinalize') ?? 
               $user->hasAnyRole(['superadmin', 'admin']);
    }

    public function export(User $user): bool
    {
        return $this->superAdminBypass($user, 'export') ?? 
               $user->hasAnyRole(['superadmin', 'admin']);
    }
}
