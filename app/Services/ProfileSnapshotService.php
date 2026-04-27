<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\Dosen;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\ProfilUser;
use App\Models\User;

class ProfileSnapshotService
{
    public function sync(User $user): ProfilUser
    {
        $user->loadMissing(['mahasiswa', 'dosen', 'profile']);

        $profileable = $this->resolveProfileable($user);

        return ProfilUser::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'profileable_type' => $profileable?->getMorphClass(),
                'profileable_id' => $profileable?->getKey(),
                'phone' => $user->phone,
                'address' => $user->address,
                'avatar' => $user->avatar,
            ]
        );
    }

    private function resolveProfileable(User $user): Mahasiswa|Dosen|null
    {
        return $user->mahasiswa ?? $user->dosen;
    }
}
