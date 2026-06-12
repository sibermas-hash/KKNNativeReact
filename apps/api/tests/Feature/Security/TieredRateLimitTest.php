<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;

/*
 * Roadmap §3.4 — Tiered rate limiting.
 *
 * Verifies the named RateLimiter registrations in AppServiceProvider:
 *   - public         → 30/min IP-based
 *   - auth_challenge → 10/min IP-based (login, captcha)
 *   - authenticated  → role-scaled (superadmin Limit::none, admin 120,
 *                      dpl/dosen/student 60, guest 30) — keyed per user
 *   - bulk           → 5/min (30 for superadmin)
 *   - file_upload    → 10/min (60 for superadmin)
 *
 * The 429 response uses the global JSON envelope (RATE_LIMITED code) via
 * bootstrap/app.php. Laravel auto-emits X-RateLimit-* headers.
 */

beforeEach(function () {
    // Each test gets a fresh rate-limit bucket. Without this, tests leak
    // their hit-count into the next test's bucket and cause flakiness.
    RateLimiter::clear('public');
    RateLimiter::clear('auth_challenge');
    RateLimiter::clear('authenticated');
});

it('emits X-RateLimit headers on public endpoint', function () {
    $response = $this->getJson('/api/v1/public/announcements');

    $response->assertOk();
    // Laravel always adds these on throttled routes.
    expect($response->headers->get('X-RateLimit-Limit'))->not->toBeNull();
    expect((int) $response->headers->get('X-RateLimit-Remaining'))->toBeGreaterThanOrEqual(0);
});

it('returns 429 with RATE_LIMITED envelope after exceeding public tier', function () {
    // public tier = 30/min. Fire 31 requests from same IP.
    $last = null;
    for ($i = 0; $i < 32; $i++) {
        $last = $this->getJson('/api/v1/public/announcements');
        if ($last->status() === 429) {
            break;
        }
    }

    $last->assertStatus(429);
    $last->assertJsonPath('success', false);
    $last->assertJsonPath('error.code', 'RATE_LIMITED');
    // Clients need Retry-After to implement correct back-off. Laravel sets
    // this on the ThrottleRequestsException; we verify the custom exception
    // renderer preserves it (bootstrap/app.php).
    expect($last->headers->get('Retry-After'))->not->toBeNull();
    expect($last->headers->get('X-RateLimit-Reset'))->not->toBeNull();
});

it('keys authenticated tier by user id — two users do not share the bucket', function () {
    $alice = createUserWithRole('student');
    $bob = createUserWithRole('student');

    // Use a simple authenticated endpoint.
    $endpoint = '/api/v1/auth/user';

    // Burn ~40 requests as alice (student tier = 60/min — plenty of room,
    // but enough to leave a measurable count in her bucket only).
    for ($i = 0; $i < 40; $i++) {
        $this->actingAs($alice)->getJson($endpoint)->assertOk();
    }

    $aliceResp = $this->actingAs($alice)->getJson($endpoint);
    $bobResp = $this->actingAs($bob)->getJson($endpoint);

    $aliceRemaining = (int) $aliceResp->headers->get('X-RateLimit-Remaining');
    $bobRemaining = (int) $bobResp->headers->get('X-RateLimit-Remaining');

    // Bob's bucket must not be drained by Alice's requests.
    expect($bobRemaining)->toBeGreaterThan($aliceRemaining);
});

it('gives admin role higher tier than student', function () {
    $student = createUserWithRole('student');
    $admin = createUserWithRole('admin');

    $endpoint = '/api/v1/auth/user';

    $studentResp = $this->actingAs($student)->getJson($endpoint)->assertOk();
    $adminResp = $this->actingAs($admin)->getJson($endpoint)->assertOk();

    $studentLimit = (int) $studentResp->headers->get('X-RateLimit-Limit');
    $adminLimit = (int) $adminResp->headers->get('X-RateLimit-Limit');

    // Per tier spec: student 60, admin 120. Assert admin strictly higher.
    expect($adminLimit)->toBeGreaterThan($studentLimit);
    expect($studentLimit)->toBe(60);
    expect($adminLimit)->toBe(120);
});

it('exempts superadmin from tier limits (no X-RateLimit-Remaining cap)', function () {
    $superadmin = createUserWithRole('superadmin');

    // Fire a burst that would blow past the admin 120/min tier.
    for ($i = 0; $i < 150; $i++) {
        $response = $this->actingAs($superadmin)->getJson('/api/v1/auth/user');
        expect($response->status())->not->toBe(429);
    }
});

it('uses the auth_challenge tier on login endpoint (10/min IP)', function () {
    // 11 consecutive login attempts from the same IP should exceed the
    // auth_challenge limit even with invalid credentials.
    $last = null;
    for ($i = 0; $i < 12; $i++) {
        $last = $this->postJson('/api/v1/auth/login', [
            'login' => 'nonexistent',
            'password' => 'wrong',
            'captcha_id' => 'invalid',
            'captcha_answer' => '0',
        ]);
        if ($last->status() === 429) {
            break;
        }
    }

    $last->assertStatus(429);
    $last->assertJsonPath('error.code', 'RATE_LIMITED');
});
