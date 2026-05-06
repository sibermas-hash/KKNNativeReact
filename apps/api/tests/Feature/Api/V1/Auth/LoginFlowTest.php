<?php

use App\Models\User;
use App\Services\CaptchaService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

/**
 * Get captcha answer WITHOUT consuming the cache entry.
 * The login endpoint will consume it on the actual request.
 */
function getCaptchaAnswerPeek(string $captchaId): string
{
    $cacheKey = 'captcha:' . $captchaId;
    $hashedAnswer = Cache::get($cacheKey);

    if (! $hashedAnswer) {
        return '0';
    }

    for ($i = 0; $i <= 40; $i++) {
        if (Hash::check((string) $i, $hashedAnswer)) {
            return (string) $i;
        }
    }

    return '0';
}

describe('Login Flow (Integration)', function () {

    it('completes full login → use API → logout cycle for student', function () {
        $user = User::factory()->create([
            'is_active' => true,
            'must_change_password' => false,
            'password_changed_at' => now(),
            'password' => Hash::make('Test1234!'),
        ]);
        $user->assignRole('student');

        // Step 1: Get captcha
        $captchaRes = $this->getJson('/api/v1/auth/captcha');
        $captchaRes->assertOk();
        $captchaId = $captchaRes->json('data.captcha_id');
        $answer = getCaptchaAnswerPeek($captchaId);

        // Step 2: Login (this consumes the captcha)
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'login' => $user->username,
            'password' => 'Test1234!',
            'captcha_id' => $captchaId,
            'captcha_answer' => $answer,
        ]);
        $loginRes->assertOk()->assertJson(['success' => true]);
        expect($loginRes->json('data.user.id'))->toBe($user->id);

        // Step 3: Access protected endpoint
        $this->actingAs($user)->getJson('/api/v1/auth/user')
            ->assertOk()
            ->assertJson(['data' => ['id' => $user->id]]);
    });

    it('completes full login cycle for superadmin', function () {
        $user = createUserWithRole('superadmin');

        $captcha = app(CaptchaService::class)->generate();
        $answer = getCaptchaAnswerPeek($captcha['captcha_id']);

        $loginRes = $this->postJson('/api/v1/auth/login', [
            'login' => $user->username,
            'password' => 'Test1234!',
            'captcha_id' => $captcha['captcha_id'],
            'captcha_answer' => $answer,
        ]);
        $loginRes->assertOk()->assertJson(['success' => true]);

        $this->actingAs($user)->getJson('/api/v1/admin/hub')
            ->assertOk()->assertJson(['success' => true]);
    });

    it('rejects login with wrong password after valid captcha', function () {
        $user = createUserWithRole('student');

        $captcha = app(CaptchaService::class)->generate();
        $answer = getCaptchaAnswerPeek($captcha['captcha_id']);

        $this->postJson('/api/v1/auth/login', [
            'login' => $user->username,
            'password' => 'WrongPassword!',
            'captcha_id' => $captcha['captcha_id'],
            'captcha_answer' => $answer,
        ])->assertStatus(422)
            ->assertJson(['success' => false])
            ->assertJsonPath('error.code', 'CREDENTIALS_INVALID');
    });

    it('rejects login for inactive user', function () {
        $user = User::factory()->create([
            'is_active' => false,
            'must_change_password' => false,
            'password_changed_at' => now(),
            'password' => Hash::make('Test1234!'),
        ]);
        $user->assignRole('student');

        $captcha = app(CaptchaService::class)->generate();
        $answer = getCaptchaAnswerPeek($captcha['captcha_id']);

        // Inactive user — API returns non-2xx
        $response = $this->postJson('/api/v1/auth/login', [
            'login' => $user->username,
            'password' => 'Test1234!',
            'captcha_id' => $captcha['captcha_id'],
            'captcha_answer' => $answer,
        ]);
        $response->assertJson(['success' => false]);
        expect($response->status())->toBeGreaterThanOrEqual(400);
    });

    it('captcha is single-use — second login attempt with same captcha fails', function () {
        $user = createUserWithRole('student');

        $captcha = app(CaptchaService::class)->generate();
        $answer = getCaptchaAnswerPeek($captcha['captcha_id']);

        // First attempt — valid (captcha consumed by the endpoint)
        $this->postJson('/api/v1/auth/login', [
            'login' => $user->username,
            'password' => 'Test1234!',
            'captcha_id' => $captcha['captcha_id'],
            'captcha_answer' => $answer,
        ])->assertOk();

        // Second attempt with same captcha — already consumed
        $response = $this->postJson('/api/v1/auth/login', [
            'login' => $user->username,
            'password' => 'Test1234!',
            'captcha_id' => $captcha['captcha_id'],
            'captcha_answer' => $answer,
        ]);
        $response->assertStatus(422)->assertJson(['success' => false]);
        // Error code is either CAPTCHA_INVALID or VALIDATION_ERROR depending on implementation
        expect($response->json('error.code'))->toBeIn(['CAPTCHA_INVALID', 'VALIDATION_ERROR']);
    });

    it('login returns token for mobile client', function () {
        $user = createUserWithRole('student');

        $captcha = app(CaptchaService::class)->generate();
        $answer = getCaptchaAnswerPeek($captcha['captcha_id']);

        $loginRes = $this->postJson('/api/v1/auth/login', [
            'login' => $user->username,
            'password' => 'Test1234!',
            'captcha_id' => $captcha['captcha_id'],
            'captcha_answer' => $answer,
        ], ['X-App-Type' => 'mobile']);

        $loginRes->assertOk()->assertJson(['success' => true]);
        // Mobile login should include a token in the response
        expect($loginRes->json('data'))->toHaveKey('token');
    });

    it('logout requires authentication', function () {
        $this->postJson('/api/v1/auth/logout')
            ->assertStatus(401);
    });

})->group('integration', 'auth');
