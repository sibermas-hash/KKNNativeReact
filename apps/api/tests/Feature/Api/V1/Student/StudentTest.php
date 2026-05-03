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
    });

    describe('Endpoints return JSON', function () {
        it('work programs returns JSON response', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('student');

            $this->actingAs($user)->getJson('/api/v1/student/work-programs')
                ->assertJson(['success' => true]);
        });

        it('certificates returns JSON response', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('student');

            $this->actingAs($user)->getJson('/api/v1/student/certificates')
                ->assertJson(['success' => true]);
        });

        it('leave requests returns JSON response', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('student');

            $this->actingAs($user)->getJson('/api/v1/student/leave-requests')
                ->assertJson(['success' => true]);
        });

        it('final report returns JSON response', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('student');

            $this->actingAs($user)->getJson('/api/v1/student/final-report')
                ->assertJson(['success' => true]);
        });
    });

})->group('student');
