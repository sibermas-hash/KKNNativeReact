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
    \Illuminate\Support\Facades\Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\DatabaseSeeder', '--force' => true]);
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

function createActivePeriod(string $phase = 'execution'): \App\Models\KKN\Periode
{
    $jenis = \App\Models\KKN\JenisKkn::firstOrCreate(
        ['code' => 'REGULER'],
        [
            'name' => 'KKN Reguler',
            'description' => 'KKN Reguler',
            'registration_mode' => 'open',
            'placement_mode' => 'manual_admin',
            'min_sks' => 100,
            'min_gpa' => 2.0,
            'color' => '#059669',
            'is_active' => true,
            'sort_order' => 0,
        ]
    );

    $tahunAkademik = \App\Models\KKN\TahunAkademik::firstOrCreate(
        ['year' => '2025/2026'],
        ['is_active' => true]
    );

    // Deactivate all other periods to ensure this is the only active one
    \App\Models\KKN\Periode::where('is_active', true)->update(['is_active' => false]);

    $period = \App\Models\KKN\Periode::factory()->state([
        'is_active' => true,
        'current_phase' => $phase,
        'jenis_kkn_id' => $jenis->id,
        'academic_year_id' => $tahunAkademik->id,
    ])->create();

    // Clear PeriodContextService caches so the new period is picked up
    \Illuminate\Support\Facades\Cache::forget('default_periode_id');
    \Illuminate\Support\Facades\Cache::forget('available_periods');
    if (auth()->check()) {
        \Illuminate\Support\Facades\Cache::forget('period_context:'.auth()->id());
    }

    return $period;
}
