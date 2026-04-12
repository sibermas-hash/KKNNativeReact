<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SmokeTest extends TestCase
{
    /**
     * Test that the home page is accessible.
     */
    public function test_home_page_is_accessible(): void
    {
        $response = $this->get(route('home'));

        $response->assertStatus(200);
    }

    /**
     * Test that the login page is accessible.
     */
    public function test_login_page_is_accessible(): void
    {
        $response = $this->get(route('login'));

        $response->assertStatus(200);
        // We just check that it's an Inertia page
        $response->assertInertia(fn ($page) => $page->component('Auth/Login'));
    }

    /**
     * Test that the dashboard redirects to login for guests.
     */
    public function test_dashboard_redirects_to_login_for_guests(): void
    {
        $response = $this->get(route('dashboard'));

        $response->assertRedirect(route('login'));
    }

    /**
     * Test that an authenticated user is redirected to their specific dashboard.
     */
    public function test_authenticated_user_is_redirected_to_role_dashboard(): void
    {
        $user = User::factory()->create([
            'is_active' => true,
            'must_change_password' => false,
        ]);
        
        Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
        $user->assignRole('student');

        $response = $this->actingAs($user)->get(route('dashboard'));

        $response->assertRedirect(route('student.dashboard'));
        
        // Follow the redirect
        $this->get(route('student.dashboard'))->assertStatus(200);
    }
}
