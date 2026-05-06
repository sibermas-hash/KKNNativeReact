<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
*/

// SECURITY FIX: RefreshDatabase causes PostgreSQL deadlocks when multiple
// test classes concurrently DROP tables. We run migrations once up-front
// and rely on DatabaseTransactions to roll back data after each test.
pest()->extend(TestCase::class)
    ->use(Illuminate\Foundation\Testing\DatabaseTransactions::class)
    ->in('Feature');

// Run migrations once before the entire Feature test suite.
// This is safe because DatabaseTransactions only starts a transaction
// inside setUp(), which runs *after* this beforeAll hook.
beforeAll(function () {
    \Illuminate\Support\Facades\Artisan::call('migrate:fresh');
});

/*
|--------------------------------------------------------------------------
| Helper Functions
|--------------------------------------------------------------------------
*/

function getCaptchaAnswer(string $captchaId): string
{
    $cacheKey = 'captcha:' . $captchaId;
    $hashedAnswer = \Illuminate\Support\Facades\Cache::get($cacheKey);

    if (! $hashedAnswer) {
        return '0';
    }

    for ($i = 0; $i <= 40; $i++) {
        if (Hash::check((string) $i, $hashedAnswer)) {
            \Illuminate\Support\Facades\Cache::forget($cacheKey);
            return (string) $i;
        }
    }

    return '0';
}

function createUserWithRole(string $role, array $permissions = []): User
{
    $user = User::factory()->create([
        'is_active' => true,
        'must_change_password' => false,
        'password_changed_at' => now(),
        'password' => Hash::make('Test1234!'),
    ]);
    $user->assignRole($role);

    foreach ($permissions as $permission) {
        $user->givePermissionTo($permission);
    }

    return $user;
}

function generateCaptchaWithAnswer(): array
{
    $captcha = app(\App\Services\CaptchaService::class)->generate();
    $answer = getCaptchaAnswer($captcha['captcha_id']);

    return [
        'captcha' => $captcha,
        'answer' => $answer,
    ];
}
