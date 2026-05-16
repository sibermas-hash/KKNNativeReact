<?php

use Illuminate\Support\Facades\Hash;

it('allows 2fa status for users with incomplete profiles', function () {
    $user = createUserWithRole('student');

    $this->actingAs($user)
        ->getJson('/api/v1/2fa/status')
        ->assertOk()
        ->assertJsonPath('data.enabled', false)
        ->assertJsonPath('data.required', false);
});

it('allows 2fa status while admin is forced to rotate password', function () {
    $user = createUserWithRole('admin');
    $user->update([
        'must_change_password' => true,
        'password_changed_at' => null,
        'password' => Hash::make('Default123!'),
    ]);

    $this->actingAs($user)
        ->getJson('/api/v1/2fa/status')
        ->assertOk()
        ->assertJsonPath('data.enabled', false)
        ->assertJsonPath('data.required', true);
});
