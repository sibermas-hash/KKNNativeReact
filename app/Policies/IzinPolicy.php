<?php

namespace App\Policies;

use App\Models\KKN\IzinMeninggalkan;
use App\Models\User;

class IzinPolicy
{
    use HandlesDplScope;

    /**
     * DPL hanya bisa approve izin dari kelompok yang dibimbingnya
     */
    public function approve(User $user, IzinMeninggalkan $izin): bool
    {
        if ($user->hasRole('superadmin')) {
            return true;
        }

        if (!$user->hasRole('dpl')) {
            return false;
        }

        $dosen = $user->dosen;
        if (!$dosen) {
            return false;
        }

        // Cek apakah DPL membimbing kelompok ini
        return $dosen->kelompokKkn()
            ->where('kelompok_kkn.id', $izin->kelompok_id)
            ->exists();
    }
}
