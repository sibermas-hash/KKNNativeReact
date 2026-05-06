<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\Dosen;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DplProvisioningService
{
    /**
     * @return array{user: User, created: bool, activated: bool, temp_password: ?string}
     */
    public function ensureDplAccount(Dosen $dosen): array
    {
        $temporaryPassword = null;
        $created = false;
        $activated = false;

        $user = $dosen->user;

        if (! $user) {
            $user = User::query()->where('username', $dosen->nip)->first();
        }

        if (! $user) {
            $temporaryPassword = Str::password(12);
            $user = User::create([
                'username' => $dosen->nip,
                'name' => $dosen->nama,
                'email' => $this->defaultEmail($dosen),
                'password' => Hash::make($temporaryPassword),
                'is_active' => true,
                'must_change_password' => true,
            ]);
            $created = true;
            $activated = true;
        } else {
            $updates = [];

            if (! $user->is_active) {
                $updates['is_active'] = true;
                $activated = true;
            }

            if (blank($user->email)) {
                $updates['email'] = $this->defaultEmail($dosen);
            }

            if ($user->name !== $dosen->nama) {
                $updates['name'] = $dosen->nama;
            }

            if ($updates !== []) {
                $user->fill($updates)->save();
            }
        }

        if ($dosen->user_id !== $user->id) {
            $dosen->update(['user_id' => $user->id]);
        }

        if (! $user->hasRole('dosen')) {
            $user->assignRole('dosen');
            $activated = true;
        }

        return [
            'user' => $user->fresh(),
            'created' => $created,
            'activated' => $activated,
            'temp_password' => $temporaryPassword,
        ];
    }

    private function defaultEmail(Dosen $dosen): string
    {
        return sprintf('%s@sibermas.uinsaizu.ac.id', $dosen->nip);
    }
}
