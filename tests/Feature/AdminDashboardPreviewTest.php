<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminDashboardPreviewTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
    }

    public function test_admin_dashboard_exposes_demo_preview_payload_for_empty_state(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $this->actingAs($admin)
            ->get(route('admin.dasbor'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Dashboard')
                ->has('demoPreview.stats')
                ->where('demoPreview.stats.total_students', 248)
                ->has('demoPreview.recentRegistrations', 3)
                ->where('demoPreview.recentRegistrations.0.mahasiswa.user.name', 'Aisyah Nur Hidayah')
            );
    }
}
