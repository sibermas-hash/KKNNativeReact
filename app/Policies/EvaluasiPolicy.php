<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\KKN\Dosen;
use App\Models\KKN\Evaluasi;
use App\Models\KKN\KelompokKkn;
use App\Models\User;

class EvaluasiPolicy extends BasePolicy
{
    /**
     * Check if the user is a DPL assigned to the given group.
     */
    private function isDplOfGroup(User $user, ?KelompokKkn $kelompok): bool
    {
        if (! $kelompok) {
            return false;
        }

        $dosen = Dosen::where('user_id', $user->id)->first();
        if (! $dosen) {
            return false;
        }

        return $kelompok->dosen()->where('dosen.id', $dosen->id)->exists();
    }

    public function viewAny(User $user): bool
    {
        return $this->superAdminBypass($user, 'viewAny') ??
               $user->hasAnyRole(['superadmin', 'dpl', 'faculty_admin']);
    }

    public function view(User $user, Evaluasi $evaluation): bool
    {
        if ($this->superAdminBypass($user, 'view')) {
            return true;
        }

        if ($user->hasRole('dpl')) {
            return $this->isDplOfGroup($user, $evaluation->kelompok);
        }

        if ($user->hasRole('faculty_admin')) {
            return (int) ($evaluation->mahasiswa?->faculty_id ?? 0) === (int) ($user->faculty_id ?? 0);
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $this->superAdminBypass($user, 'create') ??
               $user->hasRole('dpl');
    }

    public function update(User $user, Evaluasi $evaluation): bool
    {
        if ($this->superAdminBypass($user, 'update')) {
            return true;
        }

        if ($user->hasRole('dpl')) {
            return $this->isDplOfGroup($user, $evaluation->kelompok);
        }

        return false;
    }

    public function delete(User $user, Evaluasi $evaluation): bool
    {
        return $this->superAdminBypass($user, 'delete') ?? false;
    }
}
