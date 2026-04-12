<?php

namespace Tests\Feature;

use App\Models\KKN\SystemSetting;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminSystemSettingsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
    }

    public function test_superadmin_can_open_system_settings_page(): void
    {
        $user = User::factory()->create();
        $user->assignRole('superadmin');

        $response = $this->actingAs($user)->get('/admin/pengaturan/sistem');

        $response->assertOk();
    }

    public function test_superadmin_can_update_system_settings(): void
    {
        $user = User::factory()->create();
        $user->assignRole('superadmin');

        $this->actingAs($user)->get('/admin/pengaturan/sistem')->assertOk();

        $setting = SystemSetting::query()
            ->where('config_key', 'support_contact_label')
            ->firstOrFail();

        $response = $this->actingAs($user)->post('/admin/pengaturan/sistem', [
            'settings' => [
                [
                    'id' => $setting->id,
                    'value' => 'Admin KKN Siap Bantu',
                ],
            ],
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Pengaturan sistem berhasil diperbarui.');

        $this->assertDatabaseHas('system_settings', [
            'id' => $setting->id,
            'config_key' => 'support_contact_label',
            'value' => 'Admin KKN Siap Bantu',
        ], 'kkn');
    }
}
