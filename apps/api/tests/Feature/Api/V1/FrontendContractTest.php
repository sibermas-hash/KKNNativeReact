<?php

/**
 * Frontend Contract Test
 *
 * Memverifikasi bahwa semua endpoint yang digunakan frontend (packages/api-client)
 * terdaftar dan dapat diakses di backend Laravel.
 *
 * Setiap test memeriksa: route terdaftar + HTTP status sesuai (bukan 404/405).
 */

use App\Models\User;
use Spatie\Permission\Models\Role;

// ─── AUTH ENDPOINTS ───────────────────────────────────────────────────────────

test('GET /api/v1/auth/captcha returns 200', function () {
    $this->getJson('/api/v1/auth/captcha')
        ->assertStatus(200);
});

test('POST /api/v1/auth/login returns 422 on empty body (route exists)', function () {
    $this->postJson('/api/v1/auth/login', [])
        ->assertStatus(422);
});

test('POST /api/v1/auth/logout requires auth', function () {
    $this->postJson('/api/v1/auth/logout')
        ->assertStatus(401);
});

test('GET /api/v1/auth/user requires auth', function () {
    $this->getJson('/api/v1/auth/user')
        ->assertStatus(401);
});

test('POST /api/v1/auth/lupa-kata-sandi returns 422 on empty body', function () {
    $this->postJson('/api/v1/auth/lupa-kata-sandi', [])
        ->assertStatus(422);
});

test('POST /api/v1/auth/atur-ulang-kata-sandi returns 422 on empty body', function () {
    $this->postJson('/api/v1/auth/atur-ulang-kata-sandi', [])
        ->assertStatus(422);
});

// ─── PUBLIC ENDPOINTS ─────────────────────────────────────────────────────────

test('GET /api/v1/public/home returns 200', function () {
    $this->getJson('/api/v1/public/home')
        ->assertStatus(200);
});

test('GET /api/v1/public/announcements returns 200', function () {
    $this->getJson('/api/v1/public/announcements')
        ->assertStatus(200);
});

test('GET /api/v1/public/locations returns 200', function () {
    $this->getJson('/api/v1/public/locations')
        ->assertStatus(200);
});

test('GET /api/v1/public/downloads returns 200', function () {
    $this->getJson('/api/v1/public/downloads')
        ->assertStatus(200);
});

test('GET /api/v1/public/verify-certificate/{token} returns 404 for unknown token', function () {
    $this->getJson('/api/v1/public/verify-certificate/invalid-token')
        ->assertStatus(404);
});

// ─── HEALTH ENDPOINTS ─────────────────────────────────────────────────────────

test('GET /api/health returns 200', function () {
    $this->getJson('/api/health')
        ->assertStatus(200);
});

test('GET /api/ready returns 200', function () {
    $this->getJson('/api/ready')
        ->assertStatus(200);
});

// ─── LEGACY ENDPOINTS ─────────────────────────────────────────────────────────

test('GET /api/server-time returns 200', function () {
    $this->getJson('/api/server-time')
        ->assertStatus(200)
        ->assertJsonStructure(['server_unix_ms']);
});

test('POST /api/log-error requires auth (H-005)', function () {
    // Audit H-005 fix: log-error now requires auth:sanctum to prevent
    // anonymous log flooding. An unauthenticated POST must return 401.
    $this->postJson('/api/log-error', [])
        ->assertStatus(401);
});

test('POST /api/log-error returns 422 on empty body when authenticated', function () {
    // Use a superadmin to bypass EnsurePasswordChanged + EnsureProfileCompleted
    // middleware (both exempt superadmin) — we only care about the validation
    // layer here, not the profile-completion flow. is_active is set explicitly
    // to satisfy EnsureUserIsActive.
    Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
    $user = User::factory()->create(['is_active' => true]);
    $user->assignRole('superadmin');

    $this->actingAs($user)
        ->postJson('/api/log-error', [])
        ->assertStatus(422);
});

// ─── PERIOD CONTEXT & PROFILE (auth required) ────────────────────────────────

test('GET /api/v1/period-context requires auth', function () {
    $this->getJson('/api/v1/period-context')
        ->assertStatus(401);
});

test('GET /api/v1/profile requires auth', function () {
    $this->getJson('/api/v1/profile')
        ->assertStatus(401);
});

test('PATCH /api/v1/profile requires auth', function () {
    $this->patchJson('/api/v1/profile', [])
        ->assertStatus(401);
});

test('POST /api/v1/profile/avatar requires auth', function () {
    $this->postJson('/api/v1/profile/avatar')
        ->assertStatus(401);
});

test('PATCH /api/v1/profile/password requires auth', function () {
    $this->patchJson('/api/v1/profile/password', [])
        ->assertStatus(401);
});

// ─── NOTIFICATIONS & DEVICE TOKENS ───────────────────────────────────────────

test('POST /api/device-tokens requires auth', function () {
    $this->postJson('/api/device-tokens', [])
        ->assertStatus(401);
});

test('GET /api/notifications/unread requires auth', function () {
    $this->getJson('/api/notifications/unread')
        ->assertStatus(401);
});

// ─── ATTENDANCE (legacy) ──────────────────────────────────────────────────────

test('GET /api/attendance requires auth', function () {
    $this->getJson('/api/attendance')
        ->assertStatus(401);
});

test('POST /api/attendance requires auth', function () {
    $this->postJson('/api/attendance', [])
        ->assertStatus(401);
});
