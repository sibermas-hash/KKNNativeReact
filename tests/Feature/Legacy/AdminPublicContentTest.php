<?php

namespace Tests\Feature;

use App\Models\KKN\SystemSetting;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminPublicContentTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
    }

    public function test_superadmin_can_open_public_profile_editor(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $this->actingAs($admin)
            ->get('/admin/konten-publik/profil')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Website/Content/Profile')
                ->has('content')
                ->where('content.about', 'Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) UIN Profesor Kiai Haji Saifuddin Zuhri Purwokerto.')
            );
    }

    public function test_superadmin_can_update_public_profile_content(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $this->actingAs($admin)
            ->patch('/admin/konten-publik/profil', [
                'about' => 'Profil terbaru LPPM untuk halaman publik.',
                'visi' => 'Visi terbaru.',
                'misi' => 'Misi terbaru.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('system_settings', [
            'config_key' => 'site_about',
            'value' => 'Profil terbaru LPPM untuk halaman publik.',
        ]);
    }

    public function test_superadmin_can_update_schemes_and_public_page_reads_it(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $this->actingAs($admin)
            ->patch('/admin/konten-publik/skema', [
                'title' => 'Skema KKN Pilihan.',
                'intro' => 'Pengantar baru untuk halaman skema.',
                'schemes' => [
                    [
                        'title' => 'KKN Tematik',
                        'description' => 'Skema fokus pada tema prioritas.',
                        'color' => 'emerald',
                    ],
                    [
                        'title' => 'KKN Kolaboratif',
                        'description' => 'Skema lintas mitra dan lintas wilayah.',
                        'color' => 'blue',
                    ],
                ],
            ])
            ->assertRedirect();

        $stored = SystemSetting::query()->where('config_key', 'site_schemes_items')->value('value');

        $this->assertIsString($stored);
        $this->assertStringContainsString('KKN Tematik', $stored);

        $this->get(route('public.schemes'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Public/Schemes')
                ->where('content.title', 'Skema KKN Pilihan.')
                ->where('content.intro', 'Pengantar baru untuk halaman skema.')
                ->has('content.items', 2)
                ->where('content.items.0.title', 'KKN Tematik')
            );
    }
}
