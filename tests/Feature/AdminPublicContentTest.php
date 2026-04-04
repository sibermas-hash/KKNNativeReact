<?php

namespace Tests\Feature;

use App\Models\KKN\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminPublicContentTest extends TestCase
{
    use RefreshDatabase;

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
            ->get(route('admin.content.profile.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Content/Profile')
                ->has('content')
                ->where('content.about', 'Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) UIN Profesor Kiai Haji Saifuddin Zuhri Purwokerto.')
            );
    }

    public function test_superadmin_can_update_public_profile_content(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $this->actingAs($admin)
            ->post(route('admin.content.profile.update'), [
                'about' => 'Profil terbaru LPPM untuk halaman publik.',
                'visi' => 'Visi terbaru.',
                'misi' => 'Misi terbaru.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('system_settings', [
            'config_key' => 'site_about',
            'value' => 'Profil terbaru LPPM untuk halaman publik.',
        ], 'kkn');
    }

    public function test_superadmin_can_update_schemes_and_public_page_reads_it(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $this->actingAs($admin)
            ->post(route('admin.content.schemes.update'), [
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
