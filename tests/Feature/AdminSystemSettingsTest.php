<?php

use App\Models\KKN\SystemSetting;
use App\Models\User;
use Spatie\Permission\Models\Role;
use function Pest\Laravel\{actingAs, get, patch};

beforeEach(function () {
    Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
});

test('superadmin can open system settings page', function () {
    $user = User::factory()->create();
    $user->assignRole('superadmin');

    actingAs($user)
        ->get('/admin/pengaturan/sistem')
        ->assertOk();
});

test('superadmin can update system settings', function () {
    $user = User::factory()->create();
    $user->assignRole('superadmin');

    $setting = SystemSetting::query()
        ->where('config_key', 'support_contact_label')
        ->firstOrFail();

    actingAs($user)
        ->patch('/admin/pengaturan/sistem', [
            'settings' => [
                [
                    'id' => $setting->id,
                    'value' => 'Admin KKN Siap Bantu',
                ],
            ],
        ])
        ->assertRedirect()
        ->assertSessionHas('success', 'Pengaturan sistem berhasil diperbarui.');

    $this->assertDatabaseHas('system_settings', [
        'id' => $setting->id,
        'config_key' => 'support_contact_label',
        'value' => 'Admin KKN Siap Bantu',
    ], 'kkn');
});
