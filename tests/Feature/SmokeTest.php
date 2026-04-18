<?php

use App\Models\User;
use Spatie\Permission\Models\Role;
use function Pest\Laravel\{actingAs, get};

test('home page is accessible', function () {
    get(route('home'))->assertOk();
});

test('login page is accessible', function () {
    get(route('login'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Auth/Login'));
});

test('dashboard redirects to login for guests', function () {
    get('/mahasiswa')->assertRedirect(route('login'));
});

test('authenticated user is redirected to role dashboard', function () {
    $user = User::factory()->create([
        'is_active' => true,
        'must_change_password' => false,
    ]);

    Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
    $user->assignRole('student');

    actingAs($user)
        ->get(route('student.dashboard'))
        ->assertOk();
});
