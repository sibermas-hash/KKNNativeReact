<?php

namespace Tests\Feature;

use App\Models\KKN\Announcement;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminAnnouncementPersistenceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
    }

    public function test_admin_can_store_announcement_with_image_and_attachment(): void
    {
        $admin = $this->createSuperadmin();

        $image = UploadedFile::fake()->image('hero.jpg', 1600, 900);
        $attachment = UploadedFile::fake()->create('panduan-kkn.pdf', 240, 'application/pdf');

        $response = $this->actingAs($admin)->post(route('admin.warta-utama.store'), [
            'title' => 'Panduan Registrasi KKN 2026',
            'slug' => 'panduan-registrasi-kkn-2026',
            'category' => 'berita',
            'excerpt' => 'Panduan registrasi resmi untuk mahasiswa peserta KKN 2026.',
            'content' => '<p>Isi lengkap panduan registrasi KKN 2026 untuk seluruh mahasiswa.</p>',
            'is_active' => true,
            'published_at' => now()->subHour()->format('Y-m-d H:i:s'),
            'meta_title' => 'Panduan Registrasi KKN 2026',
            'meta_description' => 'Panduan registrasi resmi KKN 2026.',
            'meta_keywords' => 'kkn, registrasi, panduan',
            'image' => $image,
            'attachment' => $attachment,
        ]);

        $response->assertRedirect(route('admin.warta-utama.index'));

        $announcement = Announcement::query()->where('slug', 'panduan-registrasi-kkn-2026')->firstOrFail();

        $this->assertSame('BERITA', $announcement->category);
        $this->assertSame('Panduan registrasi resmi untuk mahasiswa peserta KKN 2026.', $announcement->excerpt);
        $this->assertNotNull($announcement->image);
        $this->assertNotNull($announcement->file_path);
        $this->assertSame('panduan-kkn.pdf', $announcement->file_name);

        Storage::disk('public')->assertExists($announcement->image);
        Storage::disk('public')->assertExists($announcement->file_path);
    }

    public function test_admin_can_update_announcement_and_replace_stored_files(): void
    {
        $admin = $this->createSuperadmin();

        $announcement = Announcement::query()->create([
            'title' => 'Artikel Lama',
            'slug' => 'artikel-lama',
            'category' => 'BERITA',
            'excerpt' => 'Ringkasan lama.',
            'content' => '<p>Konten lama.</p>',
            'is_active' => true,
            'published_at' => now()->subHour(),
            'image' => 'announcements/old-image.jpg',
            'file_path' => 'announcements/attachments/old-attachment.pdf',
            'file_name' => 'old-attachment.pdf',
        ]);

        Storage::disk('public')->put($announcement->image, 'old-image');
        Storage::disk('public')->put($announcement->file_path, 'old-attachment');

        $newImage = UploadedFile::fake()->image('new-hero.jpg', 1600, 900);
        $newAttachment = UploadedFile::fake()->create('lampiran-baru.pdf', 320, 'application/pdf');

        $response = $this->actingAs($admin)->post(route('admin.warta-utama.update', $announcement), [
            '_method' => 'PATCH',
            'title' => 'Artikel Baru',
            'slug' => 'artikel-baru',
            'category' => 'agenda',
            'excerpt' => 'Ringkasan baru.',
            'content' => '<p>Konten baru yang lebih lengkap untuk publik.</p>',
            'is_active' => true,
            'published_at' => now()->format('Y-m-d H:i:s'),
            'meta_title' => 'Artikel Baru',
            'meta_description' => 'Deskripsi baru.',
            'meta_keywords' => 'agenda, kkn',
            'image' => $newImage,
            'attachment' => $newAttachment,
            'remove_image' => false,
            'remove_attachment' => false,
        ]);

        $response->assertRedirect(route('admin.warta-utama.index'));

        $announcement->refresh();

        $this->assertSame('artikel-baru', $announcement->slug);
        $this->assertSame('AGENDA', $announcement->category);
        $this->assertSame('Ringkasan baru.', $announcement->excerpt);
        $this->assertSame('lampiran-baru.pdf', $announcement->file_name);

        Storage::disk('public')->assertMissing('announcements/old-image.jpg');
        Storage::disk('public')->assertMissing('announcements/attachments/old-attachment.pdf');
        Storage::disk('public')->assertExists($announcement->image);
        Storage::disk('public')->assertExists($announcement->file_path);
    }

    public function test_admin_can_delete_announcement_and_cleanup_storage(): void
    {
        $admin = $this->createSuperadmin();

        $announcement = Announcement::query()->create([
            'title' => 'Artikel Hapus',
            'slug' => 'artikel-hapus',
            'category' => 'BERITA',
            'excerpt' => 'Akan dihapus.',
            'content' => '<p>Konten untuk dihapus.</p>',
            'is_active' => true,
            'published_at' => now()->subHour(),
            'image' => 'announcements/delete-image.jpg',
            'file_path' => 'announcements/attachments/delete-attachment.pdf',
            'file_name' => 'delete-attachment.pdf',
        ]);

        Storage::disk('public')->put($announcement->image, 'delete-image');
        Storage::disk('public')->put($announcement->file_path, 'delete-attachment');

        $response = $this->actingAs($admin)->delete(route('admin.warta-utama.destroy', $announcement));

        $response->assertRedirect(route('admin.warta-utama.index'));
        $this->assertDatabaseMissing('announcements', ['id' => $announcement->id]);
        Storage::disk('public')->assertMissing('announcements/delete-image.jpg');
        Storage::disk('public')->assertMissing('announcements/attachments/delete-attachment.pdf');
    }

    public function test_admin_page_preview_route_can_render_article_preview(): void
    {
        $admin = $this->createSuperadmin();

        $announcement = Announcement::query()->create([
            'title' => 'Preview Artikel',
            'slug' => 'preview-artikel',
            'category' => 'BERITA',
            'excerpt' => 'Ringkasan preview.',
            'content' => '<p>Konten preview artikel untuk admin.</p>',
            'is_active' => false,
            'published_at' => now()->addDay(),
        ]);

        $this->actingAs($admin)
            ->get(route('admin.warta-utama.preview', $announcement))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Public/AnnouncementShow')
                ->where('previewMode', true)
                ->where('announcement.slug', 'preview-artikel')
            );
    }

    protected function createSuperadmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole('superadmin');

        return $user;
    }
}
