<?php

use App\Models\User;

describe('Student API', function () {

    describe('Authentication', function () {
        it('returns 401 for unauthenticated', function () {
            $this->getJson('/api/v1/student/dashboard')
                ->assertStatus(401);
        });

        it('returns 403 for non-student role', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('dosen');

            $this->actingAs($user)->getJson('/api/v1/student/dashboard')
                ->assertStatus(403);
        });

        it('returns 403 when student tries dpl routes', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('student');

            $this->actingAs($user)->getJson('/api/v1/dpl/dashboard')
                ->assertStatus(403);
        });

        it('returns 403 when student tries admin routes', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('student');

            $this->actingAs($user)->getJson('/api/v1/admin/hub')
                ->assertStatus(403);
        });
    });

    describe('Endpoints return JSON', function () {
        // Users without complete profile get PROFILE_INCOMPLETE (403), not success.
        // These tests verify the middleware fires correctly for incomplete profiles.
        it('work programs returns 403 PROFILE_INCOMPLETE for incomplete profile', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('student');

            $this->actingAs($user)->getJson('/api/v1/student/work-programs')
                ->assertStatus(403)
                ->assertJsonPath('error.code', 'PROFILE_INCOMPLETE');
        });

        it('certificates returns 403 PROFILE_INCOMPLETE for incomplete profile', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('student');

            $this->actingAs($user)->getJson('/api/v1/student/certificates')
                ->assertStatus(403)
                ->assertJsonPath('error.code', 'PROFILE_INCOMPLETE');
        });

        it('leave requests returns 403 PROFILE_INCOMPLETE for incomplete profile', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('student');

            $this->actingAs($user)->getJson('/api/v1/student/leave-requests')
                ->assertStatus(403)
                ->assertJsonPath('error.code', 'PROFILE_INCOMPLETE');
        });

        it('final report returns 403 PROFILE_INCOMPLETE for incomplete profile', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('student');

            $this->actingAs($user)->getJson('/api/v1/student/final-report')
                ->assertStatus(403)
                ->assertJsonPath('error.code', 'PROFILE_INCOMPLETE');
        });
    });

})->group('student');
