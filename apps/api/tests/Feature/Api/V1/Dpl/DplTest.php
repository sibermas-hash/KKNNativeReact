<?php

use App\Models\KKN\Dosen;
use App\Models\User;

describe('DPL API', function () {

    describe('Authentication', function () {
        it('returns 401 for unauthenticated', function () {
            $this->getJson('/api/v1/dosen/dashboard')
                ->assertStatus(401);
        });

        it('returns 403 for non-dpl role', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('student');

            $this->actingAs($user)->getJson('/api/v1/dpl/dashboard')
                ->assertStatus(403);
        });

        it('returns 403 when dpl tries admin routes', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('dpl');

            $this->actingAs($user)->getJson('/api/v1/admin/hub')
                ->assertStatus(403);
        });
    });

    describe('Dosen Dashboard', function () {
        it('returns dashboard data for dosen', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('dosen');
            $dosen = Dosen::factory()->create(['user_id' => $user->id]);

            $response = $this->actingAs($user)->getJson('/api/v1/dosen/dashboard');

            $response->assertOk()
                ->assertJson(['success' => true])
                ->assertJsonStructure(['data' => ['dpl_periods', 'workshops', 'is_dpl']]);
        });
    });

    describe('DPL Dashboard', function () {
        it('returns DPL dashboard data', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('dpl');
            $dosen = Dosen::factory()->create(['user_id' => $user->id]);

            $response = $this->actingAs($user)->getJson('/api/v1/dpl/dashboard');

            $response->assertOk()
                ->assertJson(['success' => true])
                ->assertJsonStructure(['data' => ['groups', 'pending_reports', 'at_risk_students']]);
        });
    });

    describe('DPL Groups', function () {
        it('returns groups list for dpl', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('dpl');
            $dosen = Dosen::factory()->create(['user_id' => $user->id]);

            $response = $this->actingAs($user)->getJson('/api/v1/dpl/groups');

            $response->assertOk()
                ->assertJson(['success' => true]);
        });
    });

    describe('DPL Daily Reports', function () {
        it('returns daily reports for dpl', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('dpl');
            $dosen = Dosen::factory()->create(['user_id' => $user->id]);

            $response = $this->actingAs($user)->getJson('/api/v1/dpl/daily-reports');

            $response->assertOk()
                ->assertJson(['success' => true]);
        });
    });

    describe('DPL Evaluations', function () {
        it('returns evaluations for dpl', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('dpl');
            $dosen = Dosen::factory()->create(['user_id' => $user->id]);

            $response = $this->actingAs($user)->getJson('/api/v1/dpl/evaluations');

            $response->assertOk()
                ->assertJson(['success' => true]);
        });
    });

    describe('DPL Final Reports', function () {
        it('returns final reports for dpl', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('dpl');
            $dosen = Dosen::factory()->create(['user_id' => $user->id]);

            $response = $this->actingAs($user)->getJson('/api/v1/dpl/final-reports');

            $response->assertOk()
                ->assertJson(['success' => true]);
        });
    });

    describe('DPL Monitoring', function () {
        it('returns monitoring list for dpl', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('dpl');
            $dosen = Dosen::factory()->create(['user_id' => $user->id]);

            $response = $this->actingAs($user)->getJson('/api/v1/dpl/monitoring');

            $response->assertOk()
                ->assertJson(['success' => true]);
        });
    });

    describe('DPL Leave Requests', function () {
        it('returns leave requests for dpl', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('dpl');
            $dosen = Dosen::factory()->create(['user_id' => $user->id]);

            $response = $this->actingAs($user)->getJson('/api/v1/dpl/leave-requests');

            $response->assertOk()
                ->assertJson(['success' => true]);
        });
    });

    describe('DPL Feedback', function () {
        it('returns participant feedback for dpl', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('dpl');
            $dosen = Dosen::factory()->create(['user_id' => $user->id]);

            $response = $this->actingAs($user)->getJson('/api/v1/dpl/feedback');

            $response->assertOk()
                ->assertJson(['success' => true]);
        });
    });

})->group('dpl');
