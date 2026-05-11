<?php

declare(strict_types=1);

namespace Tests\Feature\Api\V1;

use App\Models\KKN\Announcement;

/**
 * Verifikasi pemisahan content-type (berita vs pengumuman) di seluruh surface:
 *   - Public `/public/berita`         → category selain PENGUMUMAN
 *   - Public `/public/pengumuman`     → category PENGUMUMAN
 *   - Public `/public/announcements`  → ALL (backward compatible)
 *   - Admin index `?type=...`         → filter sesuai type
 *   - Home feature list               → hanya berita
 *   - Resource exposes `content_type`
 */

beforeEach(function () {
    // Buat dataset: 2 berita (BERITA + AGENDA) dan 2 pengumuman (PENGUMUMAN).
    Announcement::query()->delete();

    Announcement::create([
        'title'        => 'Berita 1 Launching',
        'slug'         => 'berita-1-launching',
        'category'     => 'BERITA',
        'content'      => 'Konten berita 1',
        'is_active'    => true,
        'published_at' => now(),
    ]);
    Announcement::create([
        'title'        => 'Agenda Workshop KKN',
        'slug'         => 'agenda-workshop-kkn',
        'category'     => 'AGENDA',
        'content'      => 'Konten agenda',
        'is_active'    => true,
        'published_at' => now()->subHour(),
    ]);
    Announcement::create([
        'title'        => 'Pengumuman Jadwal UTS',
        'slug'         => 'pengumuman-jadwal-uts',
        'category'     => 'PENGUMUMAN',
        'content'      => 'Jadwal UTS ditangguhkan.',
        'is_active'    => true,
        'show_as_popup' => true,
        'published_at' => now()->subMinutes(30),
    ]);
    Announcement::create([
        'title'        => 'Pengumuman Perbaikan Server',
        'slug'         => 'pengumuman-perbaikan-server',
        'category'     => 'PENGUMUMAN',
        'content'      => 'Server down 2 jam.',
        'is_active'    => true,
        'show_as_popup' => true,
        'published_at' => now()->subMinutes(10),
    ]);
});

it('GET /api/v1/public/berita hanya mengembalikan type berita', function () {
    $response = $this->getJson('/api/v1/public/berita');
    $response->assertOk();

    $items = $response->json('data');
    expect($items)->toHaveCount(2);
    foreach ($items as $item) {
        expect($item['category'])->not->toBe('PENGUMUMAN');
        expect($item['content_type'])->toBe('berita');
    }
});

it('GET /api/v1/public/pengumuman hanya mengembalikan type pengumuman', function () {
    $response = $this->getJson('/api/v1/public/pengumuman');
    $response->assertOk();

    $items = $response->json('data');
    expect($items)->toHaveCount(2);
    foreach ($items as $item) {
        expect($item['category'])->toBe('PENGUMUMAN');
        expect($item['content_type'])->toBe('pengumuman');
    }
});

it('GET /api/v1/public/announcements tanpa filter mengembalikan semua (backward compat)', function () {
    $response = $this->getJson('/api/v1/public/announcements');
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(4);
});

it('GET /api/v1/public/announcements?type=berita mengembalikan hanya berita', function () {
    $response = $this->getJson('/api/v1/public/announcements?type=berita');
    $response->assertOk();

    $items = $response->json('data');
    expect($items)->toHaveCount(2);
    foreach ($items as $item) {
        expect($item['content_type'])->toBe('berita');
    }
});

it('GET /api/v1/public/home featuredAnnouncements hanya berita', function () {
    $response = $this->getJson('/api/v1/public/home');
    $response->assertOk();

    $featured = $response->json('data.featuredAnnouncements');
    expect($featured)->not->toBeNull();
    foreach ($featured as $item) {
        expect($item['category'])->not->toBe('PENGUMUMAN');
        expect($item['content_type'])->toBe('berita');
    }
});

it('admin index dengan ?type=pengumuman hanya mengembalikan pengumuman', function () {
    $admin = createUserWithRole('superadmin');

    $response = $this->actingAs($admin)->getJson('/api/v1/admin/warta-utama?type=pengumuman');
    $response->assertOk();

    $items = $response->json('data');
    expect($items)->toHaveCount(2);
    foreach ($items as $item) {
        expect($item['content_type'])->toBe('pengumuman');
    }
});

it('admin index dengan ?type=berita hanya mengembalikan berita', function () {
    $admin = createUserWithRole('superadmin');

    $response = $this->actingAs($admin)->getJson('/api/v1/admin/warta-utama?type=berita');
    $response->assertOk();

    $items = $response->json('data');
    expect($items)->toHaveCount(2);
    foreach ($items as $item) {
        expect($item['content_type'])->toBe('berita');
    }
});

it('resource menyertakan content_type accessor di response', function () {
    $admin = createUserWithRole('superadmin');

    $response = $this->actingAs($admin)->getJson('/api/v1/admin/warta-utama');
    $response->assertOk();

    $items = $response->json('data');
    foreach ($items as $item) {
        expect($item)->toHaveKey('content_type');
        expect($item['content_type'])->toBeIn(['berita', 'pengumuman']);
    }
});

it('model Announcement::resolveType memetakan kategori dengan benar', function () {
    expect(Announcement::resolveType('PENGUMUMAN'))->toBe('pengumuman');
    expect(Announcement::resolveType('pengumuman'))->toBe('pengumuman'); // case-insensitive
    expect(Announcement::resolveType('BERITA'))->toBe('berita');
    expect(Announcement::resolveType('AGENDA'))->toBe('berita');
    expect(Announcement::resolveType('KEMITRAAN'))->toBe('berita');
    expect(Announcement::resolveType(null))->toBe('berita'); // default fallback aman
    expect(Announcement::resolveType('UNKNOWN'))->toBe('berita'); // kategori baru default ke berita
});
