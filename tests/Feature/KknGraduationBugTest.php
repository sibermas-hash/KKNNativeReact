<?php

use App\Models\KKN\SystemSetting;
use App\Models\User;
use Illuminate\Support\Facades\Crypt;
use Spatie\Permission\Models\Role;

test('admin dapat menyimpan konfigurasi api key ai dengan aman', function () {
    // 1. Persiapan Data (Arrange)
    // Pastikan role admin ada (karena sistem menggunakan Spatie Permission)
    $role = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    // Buat pengguna palsu dan beri role admin
    $admin = User::factory()->create();
    $admin->assignRole($role);

    // Pastikan setting untuk gemini_api_key ada di database (mocking)
    SystemSetting::firstOrCreate(
        ['config_key' => 'gemini_api_key'],
        ['label' => 'Gemini API Key', 'value' => null]
    );

    $dummyKey = 'AIzaSyTestKey1234567890';

    // 2. Aksi (Act)
    // Login sebagai admin, lalu tembak endpoint update
    $response = $this->actingAs($admin)
        ->patch(route('admin.pengaturan.sistem.ai.update'), [
            'gemini_api_key' => $dummyKey,
            'ai_enabled' => '1',
        ]);

    // 3. Verifikasi (Assert)
    // Harusnya redirect kembali dengan pesan sukses
    $response->assertSessionHas('success', 'Konfigurasi AI berhasil diperbarui.');

    // Pastikan API Key di database tersimpan dalam keadaan terenkripsi
    $savedSetting = SystemSetting::where('config_key', 'gemini_api_key')->first();

    // Verifikasi bahwa nilai yang tersimpan TIDAK SAMA dengan plaintext (sudah terenkripsi)
    expect($savedSetting->value)->not->toBe($dummyKey);

    // Verifikasi bahwa jika didekripsi, hasilnya sama dengan dummy key
    expect(Crypt::decryptString($savedSetting->value))->toBe($dummyKey);
});
