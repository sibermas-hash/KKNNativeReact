<?php

namespace Tests\Feature;

use App\Models\ApiKey;
use App\Models\Project;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ApiFullWorkflowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();

        config(['api_keys.admin_secret' => 'test_admin_secret']);
        config(['api_keys.allowed_tables' => ['_projects']]);
        config(['api_keys.self_service_enabled' => false]);
    }

    // ─── Admin Key Generation ────────────────────────────────────────────

    public function test_admin_can_generate_api_key_with_valid_secret(): void
    {
        $response = $this->postJson('/api/admin/keys', [
            'name' => 'Integration Test Key',
            'owner' => 'integration@test.com',
            'permissions' => ['read', 'write'],
        ], [
            'x-admin-secret' => 'test_admin_secret',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'api_key', 'name', 'permissions', 'project_id'])
            ->assertJson(['name' => 'Integration Test Key']);

        $this->assertDatabaseHas('_projects', ['email' => 'integration@test.com']);
        $this->assertDatabaseHas('_api_keys', ['name' => 'Integration Test Key']);
        $this->assertStringStartsWith('sk_', $response->json('api_key'));
    }

    public function test_admin_request_rejected_with_invalid_secret(): void
    {
        $response = $this->postJson('/api/admin/keys', [
            'name' => 'Bad Key',
            'owner' => 'bad@test.com',
        ], [
            'x-admin-secret' => 'wrong_secret',
        ]);

        $response->assertStatus(401);
        $this->assertDatabaseMissing('_projects', ['email' => 'bad@test.com']);
    }

    // ─── Key Can Access Public Data Endpoints ─────────────────────────────

    public function test_valid_api_key_can_read_allowed_table(): void
    {
        $key = $this->createTestKey(['read']);

        Project::create(['email' => 'readable@test.com', 'project_name' => 'Readable Project']);

        $response = $this->getJson('/api/v1/_projects', [
            'x-api-key' => $key,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_valid_api_key_can_write_to_allowed_table(): void
    {
        $key = $this->createTestKey(['read', 'write']);

        $response = $this->postJson('/api/v1/_projects', [
            'email' => 'writable@test.com',
            'project_name' => 'Writable Project',
        ], [
            'x-api-key' => $key,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['data']);

        $this->assertDatabaseHas('_projects', [
            'email' => 'writable@test.com',
            'project_name' => 'Writable Project',
        ]);
    }

    public function test_api_key_can_update_allowed_record(): void
    {
        $key = $this->createTestKey(['read', 'write']);

        $project = Project::create([
            'email' => 'updatable@test.com',
            'project_name' => 'Original Name',
        ]);

        $response = $this->patchJson("/api/v1/_projects/{$project->id}", [
            'project_name' => 'Updated Name',
        ], [
            'x-api-key' => $key,
        ]);

        $response->assertOk()
            ->assertJsonStructure(['data']);

        $this->assertDatabaseHas('_projects', [
            'id' => $project->id,
            'project_name' => 'Updated Name',
        ]);
    }

    public function test_api_key_can_delete_allowed_record(): void
    {
        $key = $this->createTestKey(['read', 'write', 'delete']);

        $project = Project::create([
            'email' => 'deletable@test.com',
            'project_name' => 'To Be Deleted',
        ]);

        $response = $this->deleteJson("/api/v1/_projects/{$project->id}", [], [
            'x-api-key' => $key,
        ]);

        $response->assertOk()
            ->assertJsonStructure(['message']);
    }

    // ─── Rate Limiting Works ─────────────────────────────────────────────

    public function test_rate_limiting_applies_to_api_requests(): void
    {
        $key = $this->createTestKey(['read']);

        // Make requests up to the rate limit (60 per minute as configured in routes/api.php)
        // We'll test that rate limiting headers are present
        $response = $this->getJson('/api/v1/_projects', [
            'x-api-key' => $key,
        ]);

        $response->assertStatus(200);

        // Verify rate limiting middleware is active by checking headers
        // The 'throttle:60,1' middleware should add rate limit headers
        $headers = $response->headers->all();
        $this->assertArrayHasKey('x-ratelimit-limit', $headers);
        $this->assertArrayHasKey('x-ratelimit-remaining', $headers);
    }

    // ─── Key Can Be Revoked ──────────────────────────────────────────────

    public function test_api_key_can_be_revoked(): void
    {
        $key = $this->createTestKey(['read']);

        $apiKey = ApiKey::where('email', 'revoke@test.com')->firstOrFail();

        $response = $this->postJson('/api/admin/keys/'.$apiKey->id.'/revoke', [], [
            'x-admin-secret' => 'test_admin_secret',
        ]);

        $response->assertOk()
            ->assertJson(['message' => 'API key berhasil dinonaktifkan.']);

        $apiKey->refresh();
        expect($apiKey->is_active)->toBeFalse();
    }

    // ─── Revoked Key No Longer Works ─────────────────────────────────────

    public function test_revoked_key_cannot_access_endpoints(): void
    {
        $key = $this->createTestKey(['read'], false); // Create inactive key

        $response = $this->getJson('/api/v1/_projects', [
            'x-api-key' => $key,
        ]);

        $response->assertStatus(403)
            ->assertJson(['error' => 'API key sudah dinonaktifkan. Hubungi admin.']);
    }

    public function test_revoked_key_cannot_write(): void
    {
        $key = $this->createTestKey(['read', 'write'], false);

        $response = $this->postJson('/api/v1/_projects', [
            'email' => 'revoked-write@test.com',
            'project_name' => 'Should Fail',
        ], [
            'x-api-key' => $key,
        ]);

        $response->assertStatus(403)
            ->assertJson(['error' => 'API key sudah dinonaktifkan. Hubungi admin.']);
    }

    // ─── Additional Security Tests ───────────────────────────────────────

    public function test_request_without_api_key_returns_401(): void
    {
        $response = $this->getJson('/api/v1/_projects');

        $response->assertStatus(401)
            ->assertJson(['error' => 'API key diperlukan. Kirim via header x-api-key.']);
    }

    public function test_invalid_api_key_returns_401(): void
    {
        $response = $this->getJson('/api/v1/_projects', [
            'x-api-key' => 'sk_invalid_key_that_does_not_exist',
        ]);

        $response->assertStatus(401)
            ->assertJson(['error' => 'API key tidak valid.']);
    }

    public function test_write_without_permission_returns_403(): void
    {
        $key = $this->createTestKey(['read']); // read-only

        $response = $this->postJson('/api/v1/_projects', [
            'email' => 'noread@test.com',
            'project_name' => 'Should Fail',
        ], [
            'x-api-key' => $key,
        ]);

        $response->assertStatus(403);
    }

    public function test_access_to_non_whitelisted_table_returns_403(): void
    {
        $key = $this->createTestKey(['read']);

        $response = $this->getJson('/api/v1/users', [
            'x-api-key' => $key,
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment(['error' => "Tabel 'users' tidak tersedia atau tidak diizinkan."]);
    }

    // ─── Full Lifecycle Test ─────────────────────────────────────────────

    public function test_full_api_key_lifecycle(): void
    {
        // 1. Admin creates API key
        $createResponse = $this->postJson('/api/admin/keys', [
            'name' => 'Lifecycle Test Key',
            'owner' => 'lifecycle@test.com',
            'permissions' => ['read', 'write'],
        ], [
            'x-admin-secret' => 'test_admin_secret',
        ]);

        $createResponse->assertStatus(201);
        $rawKey = $createResponse->json('api_key');

        // 2. Key can read data
        $readResponse = $this->getJson('/api/v1/_projects', [
            'x-api-key' => $rawKey,
        ]);
        $readResponse->assertStatus(200);

        // 3. Key can write data
        $writeResponse = $this->postJson('/api/v1/_projects', [
            'email' => 'lifecycle-project@test.com',
            'project_name' => 'Lifecycle Project',
        ], [
            'x-api-key' => $rawKey,
        ]);
        $writeResponse->assertStatus(201);

        // 4. Revoke the key
        $apiKey = ApiKey::where('email', 'lifecycle@test.com')->firstOrFail();

        $revokeResponse = $this->postJson('/api/admin/keys/'.$apiKey->id.'/revoke', [], [
            'x-admin-secret' => 'test_admin_secret',
        ]);
        $revokeResponse->assertOk();

        // 5. Revoked key no longer works
        $failedReadResponse = $this->getJson('/api/v1/_projects', [
            'x-api-key' => $rawKey,
        ]);
        $failedReadResponse->assertStatus(403);

        $failedWriteResponse = $this->postJson('/api/v1/_projects', [
            'email' => 'should-fail@test.com',
            'project_name' => 'Should Not Exist',
        ], [
            'x-api-key' => $rawKey,
        ]);
        $failedWriteResponse->assertStatus(403);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────

    private function createTestKey(array $permissions, bool $active = true): string
    {
        $key = 'sk_test_'.uniqid();

        ApiKey::create([
            'key' => $key,
            'name' => 'Test Key',
            'permissions' => $permissions,
            'email' => 'revoke@test.com',
            'is_active' => $active,
        ]);

        return $key;
    }
}
