<?php

use App\Models\KKN\Mahasiswa;
use App\Models\User;

it('maps legacy mahasiswa api_email updates to user email', function () {
    $superadmin = createUserWithRole('superadmin');

    $user = User::factory()->create([
        'username' => 'legacy-api-email-user',
        'name' => 'Legacy API Email User',
        'email' => 'before-legacy@example.test',
    ]);
    $user->assignRole('student');

    Mahasiswa::factory()->create([
        'user_id' => $user->id,
        'nama' => 'Legacy API Email User',
    ]);

    $response = $this->actingAs($superadmin)
        ->patchJson("/api/v1/admin/pengguna/{$user->id}", [
            'mahasiswa' => [
                'api_email' => 'after-legacy@example.test',
            ],
        ]);

    $response->assertOk()
        ->assertJsonPath('data.email', 'after-legacy@example.test');

    expect($user->fresh()->email)->toBe('after-legacy@example.test');
})->group('admin');
