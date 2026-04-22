<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

it('admin with password_changed_at null should redirect to dashboard, not password change', function () {
    $role = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    $user = User::factory()->create([
        'username' => 'admin_no_password_change',
        'email' => 'admin_no_password_change@test.com',
        'is_active' => true,
        'password' => Hash::make('password'),
        'password_changed_at' => null, // Never changed password
        'must_change_password' => false,
    ]);

    $user->assignRole($role);

    $response = $this
        ->withSession(['captcha_hash' => hash_hmac('sha256', '5', config('app.key'))])
        ->post('/login', [
            'login' => 'admin_no_password_change',
            'password' => 'password',
            'captcha_answer' => 5,
            'remember' => false,
        ]);

    // Admin should redirect to dashboard, not to password change page
    $response->assertRedirect('/admin');
    $this->assertAuthenticatedAs($user);
});

it('superadmin with password_changed_at null should redirect to dashboard, not password change', function () {
    $role = Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);

    $user = User::factory()->create([
        'username' => 'superadmin_no_password_change',
        'email' => 'superadmin_no_password_change@test.com',
        'is_active' => true,
        'password' => Hash::make('password'),
        'password_changed_at' => null, // Never changed password
        'must_change_password' => false,
    ]);

    $user->assignRole($role);

    $response = $this
        ->withSession(['captcha_hash' => hash_hmac('sha256', '7', config('app.key'))])
        ->post('/login', [
            'login' => 'superadmin_no_password_change',
            'password' => 'password',
            'captcha_answer' => 7,
            'remember' => false,
        ]);

    // Superadmin should redirect to dashboard, not to password change page
    $response->assertRedirect('/admin');
    $this->assertAuthenticatedAs($user);
});

it('non-admin user with password_changed_at null should redirect to password change', function () {
    $role = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);

    $user = User::factory()->create([
        'username' => 'student_no_password_change',
        'email' => 'student_no_password_change@test.com',
        'is_active' => true,
        'password' => Hash::make('password'),
        'password_changed_at' => null, // Never changed password
        'must_change_password' => false,
    ]);

    $user->assignRole($role);

    $response = $this
        ->withSession(['captcha_hash' => hash_hmac('sha256', '9', config('app.key'))])
        ->post('/login', [
            'login' => 'student_no_password_change',
            'password' => 'password',
            'captcha_answer' => 9,
            'remember' => false,
        ]);

    // Non-admin user should redirect to password change page
    $response->assertRedirect(route('profile.password-change'));
    $this->assertAuthenticatedAs($user);
});

it('admin with must_change_password=true should still redirect to dashboard', function () {
    $role = Role::firstOrCreate(['name' => 'faculty_admin', 'guard_name' => 'web']);

    $user = User::factory()->create([
        'username' => 'faculty_admin_must_change',
        'email' => 'faculty_admin_must_change@test.com',
        'is_active' => true,
        'password' => Hash::make('password'),
        'password_changed_at' => now(),
        'must_change_password' => true, // Should ignore this for admin
    ]);

    $user->assignRole($role);

    $response = $this
        ->withSession(['captcha_hash' => hash_hmac('sha256', '4', config('app.key'))])
        ->post('/login', [
            'login' => 'faculty_admin_must_change',
            'password' => 'password',
            'captcha_answer' => 4,
            'remember' => false,
        ]);

    // Admin should redirect to dashboard regardless of must_change_password flag
    $response->assertRedirect('/admin');
    $this->assertAuthenticatedAs($user);
});
