<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    /** @test */
    public function admins_can_access_admin_dashboard(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $response = $this->actingAs($admin)->get('/admin');

        $response->assertSuccessful();
    }

    /** @test */
    public function non_admins_cannot_access_admin_dashboard(): void
    {
        $user = User::factory()->create();
        // No role assigned, should hit 403 directly without student-specific redirect

        $response = $this->actingAs($user)->get('/admin');

        $response->assertForbidden();
    }

    /** @test */
    public function unauthenticated_users_cannot_access_admin_dashboard(): void
    {
        $response = $this->get('/admin');

        $response->assertRedirect('/login');
    }

    /** @test */
    public function admin_can_view_system_metrics(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $response = $this->actingAs($admin)->get('/admin');

        $response->assertSuccessful();
    }
}
