<?php

namespace Tests\Feature;

use App\Models\KKN\Announcement;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AnnouncementPublishingTest extends TestCase
{
    public function test_public_berita_only_shows_items_that_are_active_and_already_published(): void
    {
        $published = $this->createAnnouncement([
            'title' => 'Berita yang sudah tayang',
            'slug' => 'berita-yang-sudah-tayang',
            'is_active' => true,
            'published_at' => now()->subHour(),
        ]);

        $this->createAnnouncement([
            'title' => 'Berita terjadwal',
            'slug' => 'berita-terjadwal',
            'is_active' => true,
            'published_at' => now()->addDay(),
        ]);

        $this->createAnnouncement([
            'title' => 'Berita draft',
            'slug' => 'berita-draft',
            'is_active' => false,
            'published_at' => now()->subHour(),
        ]);

        $this->get(route('public.announcements'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Public/Announcements')
                ->has('announcements.data', 1)
                ->where('announcements.data.0.slug', $published->slug)
                ->where('announcements.data.0.title', $published->title)
            );

        $this->get(route('public.announcements.show', ['slug' => 'berita-terjadwal']))
            ->assertNotFound();

        $this->get(route('public.announcements.show', ['slug' => 'berita-draft']))
            ->assertNotFound();
    }

    public function test_public_berita_detail_exposes_excerpt_and_attachment_for_published_article(): void
    {
        $announcement = $this->createAnnouncement([
            'title' => 'Panduan pelaksanaan KKN',
            'slug' => 'panduan-pelaksanaan-kkn',
            'excerpt' => 'Ringkasan resmi panduan pelaksanaan KKN untuk mahasiswa dan mitra desa.',
            'file_name' => 'panduan-kkn.pdf',
            'file_path' => 'announcements/attachments/panduan-kkn.pdf',
        ]);

        $this->get(route('public.announcements.show', ['slug' => $announcement->slug]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Public/AnnouncementShow')
                ->where('announcement.slug', $announcement->slug)
                ->where('announcement.excerpt', $announcement->excerpt)
                ->where('announcement.file_name', 'panduan-kkn.pdf')
                ->where('announcement.reading_time', 1)
            );
    }

    public function test_superadmin_can_open_cms_style_admin_warta_page(): void
    {
        Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);

        $user = User::factory()->create();
        $user->assignRole('superadmin');

        $this->createAnnouncement([
            'title' => 'Artikel admin',
            'slug' => 'artikel-admin',
        ]);

        $this->actingAs($user)
            ->get(route('admin.warta-utama.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Website/Announcements/Index')
                ->has('announcements.data', 1)
                ->has('summary')
                ->has('categories')
            );
    }

    protected function createAnnouncement(array $overrides = []): Announcement
    {
        return Announcement::query()->create(array_merge([
            'title' => 'Artikel contoh',
            'slug' => 'artikel-contoh-'.fake()->unique()->numerify('###'),
            'category' => 'BERITA',
            'excerpt' => 'Ringkasan artikel contoh untuk pengujian publikasi berita.',
            'content' => '<p>Isi artikel contoh untuk pengujian publikasi berita di portal KKN.</p>',
            'is_active' => true,
            'published_at' => now()->subHour(),
        ], $overrides));
    }
}
