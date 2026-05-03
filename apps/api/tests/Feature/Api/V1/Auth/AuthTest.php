<?php

use App\Models\User;
use App\Services\CaptchaService;
use Illuminate\Support\Facades\Hash;

describe('Auth API', function () {

    describe('GET /api/v1/auth/captcha', function () {
        it('returns captcha with valid structure', function () {
            $response = $this->getJson('/api/v1/auth/captcha');

            $response->assertOk()
                ->assertJsonStructure([
                    'success',
                    'message',
                    'data' => ['captcha_id', 'question', 'expires_at'],
                ])
                ->assertJson(['success' => true]);
        });
    });

    describe('POST /api/v1/auth/login', function () {
        it('returns error for wrong captcha', function () {
            $response = $this->postJson('/api/v1/auth/login', [
                'login' => 'testuser',
                'password' => 'password123',
                'captcha_id' => '00000000-0000-0000-0000-000000000000',
                'captcha_answer' => '999',
            ]);

            $response->assertStatus(422)
                ->assertJson(['success' => false]);
        });
    });

    describe('GET /api/v1/auth/user', function () {
        it('returns 401 for unauthenticated', function () {
            $this->getJson('/api/v1/auth/user')
                ->assertStatus(401)
                ->assertJson([
                    'success' => false,
                    'error' => ['code' => 'UNAUTHORIZED'],
                ]);
        });

        it('returns user data when authenticated', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('student');

            $response = $this->actingAs($user)->getJson('/api/v1/auth/user');

            $response->assertOk()
                ->assertJson([
                    'success' => true,
                    'data' => ['id' => $user->id, 'username' => $user->username],
                ]);
        });
    });

    describe('POST /api/v1/auth/forgot-password', function () {
        it('accepts valid email', function () {
            User::factory()->create(['email' => 'test@example.com']);

            $response = $this->postJson('/api/v1/auth/lupa-kata-sandi', [
                'email' => 'test@example.com',
            ]);

            $response->assertOk()
                ->assertJson(['success' => true]);
        });

        it('rejects invalid email', function () {
            $this->postJson('/api/v1/auth/lupa-kata-sandi', [
                'email' => 'not-an-email',
            ])->assertStatus(422);
        });
    });

})->group('auth');
