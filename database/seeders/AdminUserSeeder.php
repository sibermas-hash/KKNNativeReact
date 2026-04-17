<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local')) {
            $this->command?->warn('AdminUserSeeder dilewati karena hanya diizinkan pada environment local.');

            return;
        }

        $forcedPassword = env('KKN_LOCAL_SEED_PASSWORD');
        $plainPassword = $forcedPassword ?: Str::password(16);

        $user = User::firstOrNew(['email' => 'admin@kkn.uinsaizu.ac.id']);
        $wasRecentlyCreated = ! $user->exists;

        $user->username = 'admin';
        $user->name = 'Super Admin';
        $user->is_active = true;
        $user->email_verified_at = now();

        if ($wasRecentlyCreated || $forcedPassword) {
            $user->password = Hash::make($plainPassword);
        }

        $user->save();

        if ($wasRecentlyCreated) {
            $this->command?->warn("Akun superadmin lokal dibuat. Password awal: {$plainPassword}");
        } elseif ($forcedPassword) {
            $this->command?->warn('Password akun superadmin lokal diperbarui ke nilai dari KKN_LOCAL_SEED_PASSWORD.');
        }

        if (! $user->hasRole('superadmin')) {
            $user->assignRole('superadmin');
        }
    }
}
