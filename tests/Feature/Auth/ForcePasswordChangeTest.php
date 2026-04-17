<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

it('redirects dpl with temporary password to profile until password is changed', function () {
    Role::firstOrCreate(['name' => 'dpl', 'guard_name' => 'web']);

    $user = User::factory()->create([
        'password' => Hash::make('Password#123'),
        'must_change_password' => true,
        'is_active' => true,
    ]);
    $user->assignRole('dpl');

    $this->actingAs($user)
        ->get(route('dpl.dashboard'))
        ->assertRedirect(route('profile.show'));

    $this->actingAs($user)
        ->patch(route('profile.password'), [
            'current_password' => 'Password#123',
            'password' => 'Password#456!',
            'password_confirmation' => 'Password#456!',
        ])
        ->assertRedirect();

    expect($user->fresh()->must_change_password)->toBeFalse();

    $this->actingAs($user)
        ->get(route('dpl.dashboard'))
        ->assertOk();
});
