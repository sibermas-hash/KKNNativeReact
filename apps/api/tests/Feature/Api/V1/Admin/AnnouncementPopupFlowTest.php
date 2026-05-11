<?php

declare(strict_types=1);

namespace Tests\Feature\Api\V1\Admin;

use App\Models\KKN\Announcement;

/**
 * End-to-end verifikasi flow: superadmin membuat pengumuman dengan
 * `show_as_popup=true`, dan hasilnya langsung muncul di endpoint
 * public `/api/v1/public/popup-announcement` tanpa auth.
 *
 * Regression guard untuk fitur "popup pengumuman di home" yang diminta
 * admin LP2M — pastikan:
 *   1. Superadmin bisa POST /admin/warta-utama dengan multipart payload.
 *   2. Validasi kategori (Rule::in CATEGORY_OPTIONS) menolak nilai salah.
 *   3. is_active default true walau tidak dikirim (DB default).
 *   4. /public/popup-announcement mengembalikan yang baru dibuat.
 *   5. Toggle is_active=false membuat popup hilang dari public endpoint.
 *   6. Non-popup announcement tidak bocor ke popup endpoint.
 */

beforeEach(function () {
    Announcement::query()->delete();
});

it('superadmin dapat membuat pengumuman + langsung muncul sebagai popup di home publik', function () {
    $admin = createUserWithRole('superadmin');

    $payload = [
        'title'             => 'Pengumuman Penting UTS',
        'content'           => 'Jadwal UTS ditangguhkan hingga pengumuman berikutnya.',
        'excerpt'           => 'UTS ditunda.',
        'category'          => 'PENGUMUMAN',
        'is_active'         => true,
        'show_as_popup'     => true,
        'popup_dismissable' => true,
    ];

    $create = $this->actingAs($admin)->postJson('/api/v1/admin/warta-utama', $payload);
    $create->assertCreated();
    $create->assertJsonPath('data.show_as_popup', true);
    $create->assertJsonPath('data.is_active', true);
    $create->assertJsonPath('data.category', 'PENGUMUMAN');

    // Tanpa auth — endpoint publik harus mengembalikan pengumuman yang baru dibuat.
    $popup = $this->getJson('/api/v1/public/popup-announcement');
    $popup->assertOk();
    $popup->assertJsonPath('data.title', 'Pengumuman Penting UTS');
    $popup->assertJsonPath('data.popup_dismissable', true);
    expect($popup->json('data.read_more_url'))->toStartWith('/berita/pengumuman-penting-uts');
});

it('menolak kategori yang tidak ada di CATEGORY_OPTIONS', function () {
    $admin = createUserWithRole('superadmin');

    $response = $this->actingAs($admin)->postJson('/api/v1/admin/warta-utama', [
        'title'    => 'Judul',
        'content'  => 'Isi konten',
        'category' => 'lowercase-invalid',
    ]);

    $response->assertStatus(422);
    $response->assertJsonPath('error.code', 'VALIDATION_ERROR');
    // Error envelope menempatkan validation errors di `error.errors.{field}`,
    // bukan di top-level `errors.{field}` seperti default Laravel.
    expect($response->json('error.errors.category'))->not->toBeNull();
});

it('mengeset is_active=true by default saat form tidak mengirim field is_active', function () {
    $admin = createUserWithRole('superadmin');

    $response = $this->actingAs($admin)->postJson('/api/v1/admin/warta-utama', [
        'title'   => 'Tanpa is_active',
        'content' => 'Konten',
    ]);

    $response->assertCreated();
    $response->assertJsonPath('data.is_active', true);
});

it('matikan popup via PUT is_active=false menyembunyikan dari endpoint public', function () {
    $admin = createUserWithRole('superadmin');

    // Create popup
    $created = $this->actingAs($admin)->postJson('/api/v1/admin/warta-utama', [
        'title'         => 'Popup Darurat',
        'content'       => 'Konten darurat',
        'category'      => 'PENGUMUMAN',
        'show_as_popup' => true,
    ])->assertCreated();
    $id = $created->json('data.id');

    // Awalnya muncul
    $this->getJson('/api/v1/public/popup-announcement')
        ->assertJsonPath('data.id', $id);

    // Toggle off
    $response = $this->actingAs($admin)
        ->putJson("/api/v1/admin/warta-utama/{$id}", ['is_active' => false])
        ->assertOk();

    // Verify di DB langsung — assertJsonPath kadang mismatch untuk boolean false
    expect(\App\Models\KKN\Announcement::find($id)->is_active)->toBeFalse();

    // Public endpoint tidak lagi mengembalikannya
    $this->getJson('/api/v1/public/popup-announcement')
        ->assertOk()
        ->assertJsonPath('data', null);
});

it('pengumuman aktif tanpa show_as_popup TIDAK muncul di endpoint popup', function () {
    $admin = createUserWithRole('superadmin');

    $this->actingAs($admin)->postJson('/api/v1/admin/warta-utama', [
        'title'         => 'Hanya di list berita',
        'content'       => 'Konten berita biasa',
        'category'      => 'BERITA',
        'show_as_popup' => false,
    ])->assertCreated();

    $response = $this->getJson('/api/v1/public/popup-announcement');
    $response->assertOk();
    $response->assertJsonPath('data', null);
});

it('popup dengan popup_until yang sudah lewat tidak ditampilkan', function () {
    $admin = createUserWithRole('superadmin');

    // Buat langsung via factory untuk kontrol popup_until di masa lalu.
    Announcement::query()->create([
        'title'             => 'Popup Kadaluwarsa',
        'slug'              => 'popup-kadaluwarsa',
        'category'          => 'PENGUMUMAN',
        'content'           => 'Sudah lewat',
        'is_active'         => true,
        'show_as_popup'     => true,
        'popup_until'       => now()->subDay(),
        'popup_dismissable' => true,
        'published_at'      => now()->subDays(2),
    ]);

    $this->getJson('/api/v1/public/popup-announcement')
        ->assertOk()
        ->assertJsonPath('data', null);
});
