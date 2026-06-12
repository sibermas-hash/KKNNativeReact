<?php

use App\Models\User;

describe('API Response Envelope', function () {

    it('returns 401 envelope for unauthenticated API request', function () {
        $response = $this->getJson('/api/v1/student/dashboard');

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'UNAUTHORIZED',
                ],
            ]);
    });

    it('returns 403 envelope for wrong role', function () {
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole('student');

        $response = $this->actingAs($user)->getJson('/api/v1/admin/hub');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
            ]);
    });

    it('returns success envelope with data for valid request', function () {
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole('student');

        $response = $this->actingAs($user)->getJson('/api/v1/auth/user');

        $response->assertOk()
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data',
            ]);
    });

    it('returns 422 envelope for validation errors', function () {
        $response = $this->postJson('/api/v1/auth/login', [
            'login' => '',
            'password' => '',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ])
            ->assertJsonStructure([
                'error' => ['code', 'message'],
            ]);
    });

})->group('envelope');
