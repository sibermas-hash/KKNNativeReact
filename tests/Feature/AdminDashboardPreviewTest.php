<?php

namespace Tests\Feature;

use App\Models\KKN\Fakultas;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminDashboardPreviewTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
    }

    public function test_admin_dashboard_no_longer_exposes_legacy_demo_preview_payload(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $this->actingAs($admin)
            ->get('/admin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Dashboard')
                ->missing('demoPreview')
            );
    }

    public function test_faculty_admin_dashboard_hides_public_content_controls(): void
    {
        Role::firstOrCreate(['name' => 'faculty_admin', 'guard_name' => 'web']);
        $faculty = Fakultas::factory()->create();

        $facultyAdmin = User::factory()->create([
            'faculty_id' => $faculty->id,
        ]);
        $facultyAdmin->assignRole('faculty_admin');

        $this->actingAs($facultyAdmin)
            ->get('/admin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Dashboard')
                ->where('ui.is_faculty_admin', true)
                ->where('ui.can_manage_public_content', false)
            );
    }
}
