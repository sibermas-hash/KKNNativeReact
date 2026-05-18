<?php

use App\Models\KKN\Mahasiswa;
use App\Models\ProfileChangeRequest;

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

    it('accepts map-only profile updates without creating a pending request', function () {
        $user = createUserWithRole('student');
        $user->forceFill([
            'avatar' => 'avatars/test.jpg',
            'phone' => '081234567890',
            'address' => 'Jl. Test 123',
        ])->save();

        Mahasiswa::factory()->create([
            'user_id' => $user->id,
            'nama' => $user->name,
            'nik' => '1234567890123456',
            'mother_name' => 'Ibu Test',
            'gender' => 'P',
            'shirt_size' => 'L',
            'birth_place' => 'Purwokerto',
            'birth_date' => '2001-01-01',
        ]);

        $this->actingAs($user)->patchJson('/api/v1/profile', [
            'address_village_name' => 'Getas',
            'address_district_name' => 'Playen',
            'address_regency_name' => 'Gunungkidul',
            'address_postal_code' => '55861',
            'address_lat' => -7.79067813,
            'address_lng' => 110.4337856,
            'address_verified' => true,
        ])->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonPath('message', 'Titik peta dan metadata alamat berhasil diperbarui.');

        $user->refresh();

        expect($user->address_village_name)->toBe('Getas');
        expect($user->address_district_name)->toBe('Playen');
        expect($user->address_regency_name)->toBe('Gunungkidul');
        expect($user->address_postal_code)->toBe('55861');
        expect(round((float) $user->address_lat, 8))->toBe(-7.79067813);
        expect(round((float) $user->address_lng, 7))->toBe(110.4337856);
        expect($user->address_verified_at)->not->toBeNull();
        expect(ProfileChangeRequest::where('user_id', $user->id)->count())->toBe(0);
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

        $this->actingAs($user)->patchJson('/api/v1/profile/password', [
            'current_password' => 'Test1234!',
            'password' => 'NewSecure1234!',
            'password_confirmation' => 'NewSecure1234!',
        ])->assertSuccessful();
    });

    it('password change also succeeds via post for gateway compatibility', function () {
        $user = createUserWithRole('student');

        $this->actingAs($user)->postJson('/api/v1/profile/password', [
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
