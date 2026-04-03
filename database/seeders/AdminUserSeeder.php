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

        $plainPassword = env('KKN_LOCAL_SEED_PASSWORD') ?: Str::password(16);

        $user = User::firstOrCreate(
            ['email' => 'admin@kkn.uinsaizu.ac.id'],
            [
                'username' => 'admin',
                'name' => 'Super Admin',
                'is_active' => true,
                'password' => Hash::make($plainPassword),
            ]
        );

        if ($user->wasRecentlyCreated) {
            $this->command?->warn("Akun superadmin lokal dibuat. Password awal: {$plainPassword}");
        }

        if (! $user->hasRole('superadmin')) {
            $user->assignRole('superadmin');
        }
    }
}
