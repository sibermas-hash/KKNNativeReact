<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\KKN\Dosen;
use App\Models\KKN\KegiatanKkn;
use App\Models\User;

class KegiatanKknPolicy extends BasePolicy
{
    /**
     * Check if the user is a DPL assigned to the group of this report.
     */
    private function isDplOfReport(User $user, KegiatanKkn $report): bool
    {
        $dosen = Dosen::where('user_id', $user->id)->first();
        if (! $dosen || ! $report->kelompok_id) {
            return false;
        }

        return $report->kelompok->dosen()->where('dosen.id', $dosen->id)->exists();
    }

    public function viewAny(User $user): bool
    {
        return $this->superAdminBypass($user, 'viewAny') ??
               $user->hasAnyRole(['superadmin', 'dpl', 'student', 'faculty_admin']);
    }

    public function view(User $user, KegiatanKkn $report): bool
    {
        if ($this->superAdminBypass($user, 'view')) {
            return true;
        }

        if ($user->hasRole('student')) {
            return $report->mahasiswa_id === $user->mahasiswa?->id;
        }

        if ($user->hasRole('dpl')) {
            return $this->isDplOfReport($user, $report);
        }

        if ($user->hasRole('faculty_admin')) {
            return (int) ($report->mahasiswa?->faculty_id ?? 0) === (int) ($user->faculty_id ?? 0);
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('student');
    }

    public function update(User $user, KegiatanKkn $report): bool
    {
        if ($this->superAdminBypass($user, 'update')) {
            return true;
        }

        // Only the owner can update, and only if NOT approved yet
        if ($user->hasRole('student')) {
            return $report->mahasiswa_id === $user->mahasiswa?->id && $report->status !== 'approved';
        }

        return false;
    }

    public function delete(User $user, KegiatanKkn $report): bool
    {
        if ($this->superAdminBypass($user, 'delete')) {
            return true;
        }

        // Only the owner can delete, and only if NOT approved yet
        if ($user->hasRole('student')) {
            return $report->mahasiswa_id === $user->mahasiswa?->id && $report->status !== 'approved';
        }

        return false;
    }

    public function review(User $user, KegiatanKkn $report): bool
    {
        if ($this->superAdminBypass($user, 'review')) {
            return true;
        }

        if ($user->hasRole('dpl')) {
            return $this->isDplOfReport($user, $report);
        }

        return false;
    }
}
