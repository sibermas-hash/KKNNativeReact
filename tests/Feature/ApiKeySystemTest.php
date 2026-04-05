<?php

namespace Tests\Feature;

use App\Mail\ApiKeyGenerated;
use App\Models\ApiKey;
use App\Models\Project;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ApiKeySystemTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();

        // Set admin secret for tests
        config(['api_keys.admin_secret' => 'test_admin_secret']);
        config(['api_keys.allowed_tables' => ['_projects']]);
        config(['api_keys.self_service_enabled' => false]);
    }

    // ─── Admin Key Generation ────────────────────────────────────────────

    public function test_admin_can_generate_api_key_with_valid_secret(): void
    {
        $response = $this->postJson('/api/admin/keys', [
            'name' => 'Project Test',
            'owner' => 'test@example.com',
            'permissions' => ['read', 'write'],
        ], [
            'x-admin-secret' => 'test_admin_secret',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'api_key', 'name', 'permissions', 'project_id'])
            ->assertJson(['name' => 'Project Test']);

        $this->assertDatabaseHas('_projects', ['email' => 'test@example.com']);
        $this->assertDatabaseHas('_api_keys', ['name' => 'Project Test']);
        $this->assertStringStartsWith('sk_', $response->json('api_key'));
        $this->assertTrue(Hash::check($response->json('api_key'), ApiKey::firstOrFail()->getRawOriginal('key')));
    }

    public function test_admin_request_rejected_with_invalid_secret(): void
    {
        $response = $this->postJson('/api/admin/keys', [
            'name' => 'Bad Project',
            'owner' => 'bad@example.com',
        ], [
            'x-admin-secret' => 'wrong_secret',
        ]);

        $response->assertStatus(401);
        $this->assertDatabaseMissing('_projects', ['email' => 'bad@example.com']);
    }

    public function test_admin_request_rejected_without_secret(): void
    {
        $response = $this->postJson('/api/admin/keys', [
            'name' => 'No Secret',
            'owner' => 'nosecret@example.com',
        ]);

        $response->assertStatus(401);
    }

    // ─── Self-Service Registration ───────────────────────────────────────

    public function test_self_service_registration_creates_project_and_key(): void
    {
        config(['api_keys.self_service_enabled' => true]);

        $response = $this->postJson('/api/register', [
            'project_name' => 'Client App',
            'email' => 'client@example.com',
            'use_case' => 'E-commerce integration',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'api_key', 'project_name', 'permissions'])
            ->assertJson([
            'project_name' => 'Client App',
            'permissions' => ['read'],
        ]);

        $this->assertDatabaseHas('_projects', [
            'email' => 'client@example.com',
            'project_name' => 'Client App',
        ]);
        $this->assertStringStartsWith('sk_', $response->json('api_key'));
        $this->assertTrue(Hash::check($response->json('api_key'), ApiKey::firstOrFail()->getRawOriginal('key')));
        Mail::assertSent(ApiKeyGenerated::class);
    }

    public function test_duplicate_email_returns_409(): void
    {
        config(['api_keys.self_service_enabled' => true]);

        Project::create([
            'email' => 'dupe@example.com',
            'project_name' => 'Existing',
        ]);

        $response = $this->postJson('/api/register', [
            'project_name' => 'Another',
            'email' => 'dupe@example.com',
        ]);

        $response->assertStatus(409)
            ->assertJson(['error' => 'Email sudah terdaftar. Hubungi admin jika butuh key baru.']);
    }

    public function test_self_service_registration_is_disabled_by_default(): void
    {
        $response = $this->postJson('/api/register', [
            'project_name' => 'Client App',
            'email' => 'client@example.com',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'error' => 'Registrasi mandiri API key sedang dinonaktifkan. Hubungi admin untuk pengajuan akses.',
            ]);
    }

    // ─── Public Data API ─────────────────────────────────────────────────

    public function test_valid_api_key_can_read_allowed_table(): void
    {
        $key = $this->createTestKey(['read']);

        // The _projects table is in our test whitelist, seed some data
        Project::create(['email' => 'a@b.com', 'project_name' => 'A']);

        $response = $this->getJson('/api/v1/_projects', [
            'x-api-key' => $key,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_request_without_api_key_returns_401(): void
    {
        $response = $this->getJson('/api/v1/_projects');

        $response->assertStatus(401)
            ->assertJson(['error' => 'API key diperlukan. Kirim via header x-api-key.']);
    }

    public function test_invalid_api_key_returns_401(): void
    {
        $response = $this->getJson('/api/v1/_projects', [
            'x-api-key' => 'sk_invalid_key_here',
        ]);

        $response->assertStatus(401)
            ->assertJson(['error' => 'API key tidak valid.']);
    }

    public function test_inactive_api_key_returns_403(): void
    {
        $key = $this->createTestKey(['read'], false);

        $response = $this->getJson('/api/v1/_projects', [
            'x-api-key' => $key,
        ]);

        $response->assertStatus(403)
            ->assertJson(['error' => 'API key sudah dinonaktifkan. Hubungi admin.']);
    }

    public function test_write_without_permission_returns_403(): void
    {
        $key = $this->createTestKey(['read']); // read-only

        $response = $this->postJson('/api/v1/_projects', [
            'email' => 'new@example.com',
            'project_name' => 'New',
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

    // ─── Helpers ─────────────────────────────────────────────────────────

    private function createTestKey(array $permissions, bool $active = true): string
    {
        $key = 'sk_test_' . uniqid();

        ApiKey::create([
            'key' => $key,
            'name' => 'Test Key',
            'permissions' => $permissions,
            'email' => 'test@key.com',
            'is_active' => $active,
        ]);

        return $key;
    }
}
