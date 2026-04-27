<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DeviceTokenTest extends TestCase
{
    public function test_authenticated_user_can_store_device_token(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->postJson(route('api.device-tokens.store'), [
            'token' => 'native-device-token-123',
            'device_type' => 'android',
        ])->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertDatabaseHas('device_tokens', [
            'user_id' => $user->id,
            'token' => 'native-device-token-123',
            'platform' => 'android',
        ]);
    }
}
