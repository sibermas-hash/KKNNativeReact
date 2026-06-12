<?php

use App\Models\User;

describe('Admin API', function () {

    describe('Authentication', function () {
        it('returns 401 for unauthenticated', function () {
            $this->getJson('/api/v1/admin/hub')
                ->assertStatus(401);
        });

        it('returns 403 for non-admin role', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('student');

            $this->actingAs($user)->getJson('/api/v1/admin/hub')
                ->assertStatus(403);
        });

        it('returns 403 when dpl tries admin routes', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('dpl');

            $this->actingAs($user)->getJson('/api/v1/admin/hub')
                ->assertStatus(403);
        });
    });

    describe('Hub', function () {
        it('returns hub data for admin', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('superadmin');

            $response = $this->actingAs($user)->getJson('/api/v1/admin/hub');

            $response->assertOk()
                ->assertJson(['success' => true]);
        });
    });

    describe('Dashboard', function () {
        it('returns dashboard for superadmin', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('superadmin');

            $response = $this->actingAs($user)->getJson('/api/v1/admin/dashboard');

            $response->assertOk()
                ->assertJson(['success' => true]);
        });
    });

    describe('User Management', function () {
        it('returns users list for admin', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('superadmin');

            $response = $this->actingAs($user)->getJson('/api/v1/admin/pengguna');

            $response->assertOk()
                ->assertJson(['success' => true]);
        });
    });

    describe('Periods', function () {
        it('returns periods list for admin', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('superadmin');

            $response = $this->actingAs($user)->getJson('/api/v1/admin/periode');

            $response->assertOk()
                ->assertJson(['success' => true]);
        });
    });

    describe('Registrations', function () {
        it('returns registrations list for admin', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('superadmin');

            $response = $this->actingAs($user)->getJson('/api/v1/admin/pendaftaran');

            $response->assertOk()
                ->assertJson(['success' => true]);
        });
    });

})->group('admin');
