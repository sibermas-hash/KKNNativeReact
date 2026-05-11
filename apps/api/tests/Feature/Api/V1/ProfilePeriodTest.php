<?php

describe('Profile & Period Context (E2E)', function () {

    it('authenticated user can view their profile', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->getJson('/api/v1/profile')
            ->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure(['data' => ['user' => ['id', 'name', 'username']]]);
    });

    it('authenticated user can update profile name', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->patchJson('/api/v1/profile', [
            'name' => 'Updated Name',
        ])->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonPath('message', 'Profil berhasil dilengkapi. Silakan lanjutkan menggunakan portal.');
    });

    it('profile update rejects name that is too long', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->patchJson('/api/v1/profile', [
            'name' => str_repeat('a', 300),
        ])->assertStatus(422);
    });

    it('authenticated user can get period context', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->getJson('/api/v1/period-context')
            ->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure(['data' => ['active_period', 'available_periods', 'current_phase']]);
    });

    it('unauthenticated user cannot get period context', function () {
        $this->getJson('/api/v1/period-context')
            ->assertStatus(401);
    });

    it('password change requires current_password field', function () {
        $user = createUserWithRole('student');

        // Missing current_password → 422
        $this->actingAs($user)->patchJson('/api/v1/profile/password', [
            'password' => 'NewPass1234!',
            'password_confirmation' => 'NewPass1234!',
        ])->assertStatus(422);
    });

    it('password change rejects wrong current password with 422', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->patchJson('/api/v1/profile/password', [
            'current_password' => 'WrongPassword!',
            'password' => 'NewSecure1234!',
            'password_confirmation' => 'NewSecure1234!',
        ])->assertStatus(422);
    });

    it('password change succeeds with valid data', function () {
        $user = createUserWithRole('student');

        // Note: changePassword returns noContent (204) on success
        $this->actingAs($user)->patchJson('/api/v1/profile/password', [
            'current_password' => 'Test1234!',
            'password' => 'NewSecure1234!',
            'password_confirmation' => 'NewSecure1234!',
        ])->assertSuccessful();
    });

    it('unauthenticated user cannot view profile', function () {
        $this->getJson('/api/v1/profile')
            ->assertStatus(401);
    });

    it('unauthenticated user cannot update profile', function () {
        $this->patchJson('/api/v1/profile', ['name' => 'Test'])
            ->assertStatus(401);
    });

})->group('e2e', 'profile');
