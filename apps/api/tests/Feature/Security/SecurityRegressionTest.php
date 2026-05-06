<?php

declare(strict_types=1);

namespace Tests\Feature\Security;

use Tests\TestCase;

/**
 * Regression tests for security fixes documented in docs/SECURITY_REMEDIATION.md.
 *
 * These tests guard against re-introducing vulnerabilities such as:
 *  - C-001 TestAutoLogin env-based bypass
 *  - C-002 EnsurePhase env-based bypass
 *  - C-003 KknThrottle local env skip
 *  - C-004 PublicDataController generic write/delete
 *  - H-001 CORS wildcard methods/headers
 *  - Bug INTEG-001: MethodNotAllowedHttpException → 500 (now 405)
 */
class SecurityRegressionTest extends TestCase
{

    /**
     * C-001: TestAutoLogin must NOT activate just because APP_ENV=local.
     * Bypass requires BOTH config flag enabled AND X-Test-Mode header.
     */
    public function test_test_auto_login_disabled_by_default(): void
    {
        config(['auth.test_auto_login_enabled' => false]);

        $response = $this->withHeaders([
            'X-Test-Mode' => 'enabled',
            'X-Test-Login' => 'admin',
        ])->getJson('/api/v1/auth/user');

        // Without explicit config flag, login bypass MUST NOT happen
        $response->assertStatus(401);
    }

    public function test_test_auto_login_does_not_trigger_without_header(): void
    {
        config(['auth.test_auto_login_enabled' => true]);

        $response = $this->getJson('/api/v1/auth/user');

        $response->assertStatus(401);
    }

    /**
     * C-004: Public data API must reject write methods with 405 Method Not Allowed.
     */
    public function test_public_data_api_rejects_post(): void
    {
        $response = $this->postJson('/api/v1/data/lokasi', []);

        $response->assertStatus(405)
            ->assertJsonPath('error.code', 'METHOD_NOT_ALLOWED');
    }

    public function test_public_data_api_rejects_patch(): void
    {
        $response = $this->patchJson('/api/v1/data/lokasi/1', []);

        $response->assertStatus(405);
    }

    public function test_public_data_api_rejects_delete(): void
    {
        $response = $this->deleteJson('/api/v1/data/lokasi/1');

        $response->assertStatus(405);
    }

    /**
     * C-004: GET on public data without API key returns 401.
     */
    public function test_public_data_api_requires_api_key(): void
    {
        $response = $this->getJson('/api/v1/data/lokasi');

        $response->assertStatus(401);
    }

    /**
     * H-001: CORS must NOT use wildcards.
     */
    public function test_cors_methods_are_explicit(): void
    {
        $allowedMethods = config('cors.allowed_methods');

        $this->assertNotContains('*', $allowedMethods, 'CORS allowed_methods must not contain wildcard');
        $this->assertContains('GET', $allowedMethods);
        $this->assertContains('POST', $allowedMethods);
    }

    public function test_cors_headers_are_explicit(): void
    {
        $allowedHeaders = config('cors.allowed_headers');

        $this->assertNotContains('*', $allowedHeaders, 'CORS allowed_headers must not contain wildcard');
        $this->assertContains('Authorization', $allowedHeaders);
    }

    /**
     * INTEG-001: MethodNotAllowedHttpException must return 405 with proper envelope,
     * not 500 SERVER_ERROR.
     */
    public function test_method_not_allowed_returns_405_envelope(): void
    {
        // /api/v1/public/home is GET-only
        $response = $this->postJson('/api/v1/public/home');

        $response->assertStatus(405)
            ->assertJsonStructure([
                'success',
                'error' => ['code', 'message'],
            ])
            ->assertJsonPath('success', false)
            ->assertJsonPath('error.code', 'METHOD_NOT_ALLOWED');
    }

    /**
     * 404 NotFound returns proper envelope.
     */
    public function test_unknown_api_route_returns_404_envelope(): void
    {
        $response = $this->getJson('/api/v1/this-does-not-exist');

        $response->assertStatus(404)
            ->assertJsonPath('error.code', 'NOT_FOUND');
    }

    /**
     * Health check endpoints are publicly accessible.
     */
    public function test_health_endpoint_is_public(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'timestamp',
            ]);
    }

    public function test_ready_endpoint_returns_status(): void
    {
        $response = $this->getJson('/api/ready');

        $response->assertJsonStructure([
            'status',
            'timestamp',
        ]);
    }
}
