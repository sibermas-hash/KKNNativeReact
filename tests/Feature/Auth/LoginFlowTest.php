<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

it('allows a local user to log in with username and captcha', function () {
    $role = Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);

    $user = User::factory()->create([
        'username' => 'adminlogin',
        'email' => 'adminlogin@example.test',
        'is_active' => true,
        'password' => Hash::make('password'),
    ]);

    $user->assignRole($role);

    $response = $this
        ->withSession(['captcha_hash' => hash_hmac('sha256', '8', config('app.key'))])
        ->post('/login', [
            'login' => 'adminlogin',
            'password' => 'password',
            'captcha_answer' => 8,
            'remember' => false,
        ]);

    $response->assertRedirect('/dashboard');
    $this->assertAuthenticatedAs($user);
});

it('rejects login when captcha is incorrect', function () {
    User::factory()->create([
        'username' => 'captchatest',
        'email' => 'captchatest@example.test',
        'is_active' => true,
        'password' => Hash::make('password'),
    ]);

    $response = $this
        ->from('/login')
        ->withSession(['captcha_hash' => hash_hmac('sha256', '9', config('app.key'))])
        ->post('/login', [
            'login' => 'captchatest',
            'password' => 'password',
            'captcha_answer' => 7,
            'remember' => false,
        ]);

    $response
        ->assertRedirect('/login')
        ->assertSessionHasErrors('captcha_answer');

    $this->assertGuest();
});

it('rejects login for inactive users even when credentials and captcha are correct', function () {
    User::factory()->create([
        'username' => 'inactiveadmin',
        'email' => 'inactiveadmin@example.test',
        'is_active' => false,
        'password' => Hash::make('password'),
    ]);

    $response = $this
        ->from('/login')
        ->withSession(['captcha_hash' => hash_hmac('sha256', '6', config('app.key'))])
        ->post('/login', [
            'login' => 'inactiveadmin',
            'password' => 'password',
            'captcha_answer' => 6,
            'remember' => false,
        ]);

    $response
        ->assertRedirect('/login')
        ->assertSessionHasErrors('login');

    $this->assertGuest();
});

it('renders login page with captcha metadata and can refresh captcha asynchronously', function () {
    $this->get('/login')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Auth/Login')
            ->has('captcha_question')
            ->has('captcha_generated_at')
            ->where('captcha_ttl_seconds', 600)
        );

    $tokenBeforeRefresh = session()->token();

    $this->getJson(route('login.captcha.refresh'))
        ->assertOk()
        ->assertJsonStructure([
            'question',
            'generated_at',
            'ttl_seconds',
        ])
        ->assertJson([
            'ttl_seconds' => 600,
        ]);

    expect(session('captcha_hash'))->not->toBeNull();
    expect(session('captcha_question'))->not->toBeNull();
    expect(session('captcha_generated_at'))->not->toBeNull();
    expect(session()->token())->toBe($tokenBeforeRefresh);
});
