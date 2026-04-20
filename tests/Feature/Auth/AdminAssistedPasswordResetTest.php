<?php

use App\Models\KKN\SystemSetting;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

it('renders the forgot password page with whatsapp support guidance', function () {
    SystemSetting::set('support_contact_label', 'Admin LPPM');
    SystemSetting::set('support_whatsapp_number', '0812-3456-7890');

    $this->get(route('password.request'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Auth/ForgotPassword')
            ->where('support_contact_label', 'Admin LPPM')
            ->where('support_whatsapp_number', '6281234567890')
            ->where('support_whatsapp_link', fn ($value) => is_string($value) && str_contains($value, 'https://wa.me/6281234567890'))
        );
});

it('redirects forgot password submissions to the admin-assisted flow', function () {
    User::factory()->create(['email' => 'test@example.com']);
    $this->from(route('password.request'))
        ->post(route('password.email'), ['email' => 'test@example.com'])
        ->assertRedirect(route('password.request'))
        ->assertSessionHas('status');
});

it('allows an admin to generate a temporary password for any account', function () {
    Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);

    $admin = User::factory()->create([
        'username' => 'adminreset',
        'email' => 'adminreset@example.test',
    ]);
    $admin->assignRole('superadmin');

    $student = User::factory()->create([
        'username' => '2024001001',
        'email' => 'student-reset@example.test',
        'must_change_password' => false,
        'password_changed_at' => now(),
    ]);
    $student->assignRole('student');

    $this->actingAs($admin)
        ->from('/admin/mahasiswa')
        ->post(route('admin.pengguna.reset-password', $student))
        ->assertRedirect('/admin/mahasiswa')
        ->assertSessionHas('temporary_username', '2024001001')
        ->assertSessionHas('temporary_password');

    $temporaryPassword = session('temporary_password');

    expect($temporaryPassword)->toBeString()->not->toBe('');
    expect($student->fresh()->must_change_password)->toBeTrue();
    expect($student->fresh()->password_changed_at)->toBeNull();
    expect(Hash::check($temporaryPassword, $student->fresh()->password))->toBeTrue();
});
