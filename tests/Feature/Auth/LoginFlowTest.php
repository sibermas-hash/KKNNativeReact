<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
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

    $response->assertRedirect('/');
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
