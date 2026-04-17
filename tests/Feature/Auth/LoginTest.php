<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Tests\TestCase;

class LoginTest extends TestCase
{
    /**
     * Set up captcha session so login can proceed.
     */
    private function withCaptchaSession(): self
    {
        $answer = 42;
        $hash = hash_hmac('sha256', (string) $answer, config('app.key'));

        session([
            'captcha_hash' => $hash,
            'captcha_question' => 'Berapa hasil 20 + 22?',
            'captcha_generated_at' => now()->timestamp,
        ]);

        return $this;
    }

    /** @test */
    public function users_can_login(): void
    {
        $user = User::factory()->create([
            'username' => 'testuser',
            'password' => bcrypt('password'),
        ]);
        $user->assignRole('superadmin');

        $this->withCaptchaSession();

        $response = $this->post('/login', [
            'login' => 'testuser',
            'password' => 'password',
            'captcha_answer' => '42',
        ]);

        $response->assertRedirect('/admin');
        $this->assertAuthenticatedAs($user);
    }

    /** @test */
    public function login_fails_with_invalid_credentials(): void
    {
        User::factory()->create([
            'username' => 'testuser',
            'password' => bcrypt('password'),
        ]);

        $this->withCaptchaSession();

        $response = $this->from('/login')->post('/login', [
            'login' => 'testuser',
            'password' => 'wrong-password',
            'captcha_answer' => '42',
        ]);

        $response->assertRedirect('/login');
        $this->assertGuest();
    }

    /** @test */
    public function users_can_logout(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->post('/logout');

        $response->assertRedirect('/');
        $this->assertGuest();
    }
}
