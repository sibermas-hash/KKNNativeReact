<?php

namespace App\Policies;

use App\Models\User;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\KelompokKkn;

class KknScorePolicy extends BasePolicy
{
    /**
     * Check if the user is a DPL assigned to the given group via pivot table.
     */
    private function isDplOfGroup(User $user, ?KelompokKkn $kelompok): bool
    {
        if (!$kelompok) {
            return false;
        }

        $dosen = \App\Models\KKN\Dosen::where('user_id', $user->id)->first();
        if (!$dosen) {
            return false;
        }

        return $kelompok->dosen()->where('dosen.id', $dosen->id)->exists();
    }

    public function viewAny(User $user): bool
    {
        return $this->superAdminBypass($user, 'viewAny') ?? 
               $user->hasAnyRole(['superadmin', 'dpl', 'faculty_admin']);
    }

    public function view(User $user, NilaiKkn $score): bool
    {
        if ($bypass = $this->superAdminBypass($user, 'view')) return true;

        // DPL only views scores of their assigned group (multi-DPL via pivot)
        if ($user->hasRole('dpl')) {
            return $this->isDplOfGroup($user, $score->kelompok);
        }

        if ($user->hasRole('faculty_admin')) {
            return (int) ($score->mahasiswa?->faculty_id ?? 0) === (int) ($user->faculty_id ?? 0);
        }

        // Student only views their own FINALIZED score
        if ($user->hasRole('student')) {
            return $score->user_id === $user->id && $score->is_finalized;
        }

        return $user->hasRole('superadmin');
    }

    public function create(User $user): bool
    {
        return $this->superAdminBypass($user, 'create') ?? 
               $user->hasAnyRole(['superadmin', 'dpl']);
    }

    public function update(User $user, NilaiKkn $score): bool
    {
        // Finalized scores cannot be edited by anyone
        if ($score->is_finalized) {
            return false;
        }

        if ($this->superAdminBypass($user, 'update')) return true;

        // Superadmin can update any non-finalized score
        if ($user->hasRole('superadmin')) {
            return true;
        }
        
        // DPL can update scores for their group (multi-DPL via pivot)
        if ($user->hasRole('dpl')) {
            return $this->isDplOfGroup($user, $score->kelompok);
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
               $user->hasRole('superadmin');
    }

    public function bulkFinalize(User $user): bool
    {
        return $this->superAdminBypass($user, 'bulkFinalize') ?? 
               $user->hasRole('superadmin');
    }

    public function export(User $user): bool
    {
        return $this->superAdminBypass($user, 'export') ?? 
               $user->hasRole('superadmin');
    }
}
