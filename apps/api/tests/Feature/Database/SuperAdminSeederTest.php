<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;

it('superadmin seeder honors cached bootstrap config values', function () {
    config([
        'app.bootstrap_superadmin' => [
            'username' => 'seeded_superadmin',
            'name' => 'Seeded Superadmin',
            'email' => 'seeded-superadmin@example.test',
            'password' => 'Password#123',
        ],
    ]);

    User::query()
        ->where('username', 'seeded_superadmin')
        ->orWhere('email', 'seeded-superadmin@example.test')
        ->delete();

    $exitCode = Artisan::call('db:seed', [
        '--class' => 'Database\\Seeders\\SuperAdminSeeder',
        '--force' => true,
    ]);

    expect($exitCode)->toBe(0);

    $user = User::query()
        ->where('username', 'seeded_superadmin')
        ->where('email', 'seeded-superadmin@example.test')
        ->first();

    expect($user)->not->toBeNull();
    expect($user->name)->toBe('Seeded Superadmin');
    expect($user->is_active)->toBeTrue();
    expect($user->must_change_password)->toBeFalse();
    expect(Hash::check('Password#123', $user->password))->toBeTrue();
    expect($user->hasRole('superadmin'))->toBeTrue();
});
