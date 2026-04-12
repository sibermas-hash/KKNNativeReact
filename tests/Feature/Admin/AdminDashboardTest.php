<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function admins_can_access_admin_dashboard(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->get('/admin/dashboard');

        $response->assertSuccessful();
    }

    /** @test */
    public function non_admins_cannot_access_admin_dashboard(): void
    {
        $student = User::factory()->create();
        $student->assignRole('mahasiswa');

        $response = $this->actingAs($student)->get('/admin/dashboard');

        $response->assertStatus(403);
    }

    /** @test */
    public function unauthenticated_users_cannot_access_admin_dashboard(): void
    {
        $response = $this->get('/admin/dashboard');

        $response->assertRedirect('/login');
    }

    /** @test */
    public function admin_can_view_system_metrics(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->json('GET', '/admin/dashboard');

        $response->assertSuccessful();
        $response->assertJsonStructure([
            'auth',
            'props',
        ]);
    }
}
