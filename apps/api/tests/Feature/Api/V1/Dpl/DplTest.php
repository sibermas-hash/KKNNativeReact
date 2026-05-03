<?php

use App\Models\KKN\Dosen;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\Periode;
use App\Models\User;

describe('DPL API', function () {

    describe('GET /api/v1/dosen/dashboard', function () {
        it('returns 401 for unauthenticated', function () {
            $this->getJson('/api/v1/dosen/dashboard')
                ->assertStatus(401);
        });

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

    describe('GET /api/v1/dpl/dashboard', function () {
        it('returns 403 for non-dpl role', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('student');

            $this->actingAs($user)->getJson('/api/v1/dpl/dashboard')
                ->assertStatus(403);
        });

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

    describe('GET /api/v1/dpl/groups', function () {
        it('returns groups list for dpl', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('dpl');
            $dosen = Dosen::factory()->create(['user_id' => $user->id]);

            $response = $this->actingAs($user)->getJson('/api/v1/dpl/groups');

            $response->assertOk()
                ->assertJson(['success' => true]);
        });
    });

    describe('GET /api/v1/dpl/daily-reports', function () {
        it('returns daily reports for dpl', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('dpl');
            $dosen = Dosen::factory()->create(['user_id' => $user->id]);

            $response = $this->actingAs($user)->getJson('/api/v1/dpl/daily-reports');

            $response->assertOk()
                ->assertJson(['success' => true]);
        });
    });

    describe('GET /api/v1/dpl/evaluations', function () {
        it('returns evaluations for dpl', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('dpl');
            $dosen = Dosen::factory()->create(['user_id' => $user->id]);

            $response = $this->actingAs($user)->getJson('/api/v1/dpl/evaluations');

            $response->assertOk()
                ->assertJson(['success' => true]);
        });
    });

    describe('GET /api/v1/dpl/final-reports', function () {
        it('returns final reports for dpl', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('dpl');
            $dosen = Dosen::factory()->create(['user_id' => $user->id]);

            $response = $this->actingAs($user)->getJson('/api/v1/dpl/final-reports');

            $response->assertOk()
                ->assertJson(['success' => true]);
        });
    });

    describe('GET /api/v1/dpl/monitoring', function () {
        it('returns monitoring list for dpl', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('dpl');
            $dosen = Dosen::factory()->create(['user_id' => $user->id]);

            $response = $this->actingAs($user)->getJson('/api/v1/dpl/monitoring');

            $response->assertOk()
                ->assertJson(['success' => true]);
        });
    });

    describe('GET /api/v1/dpl/leave-requests', function () {
        it('returns leave requests for dpl', function () {
            $user = User::factory()->create(['is_active' => true]);
            $user->assignRole('dpl');
            $dosen = Dosen::factory()->create(['user_id' => $user->id]);

            $response = $this->actingAs($user)->getJson('/api/v1/dpl/leave-requests');

            $response->assertOk()
                ->assertJson(['success' => true]);
        });
    });

    describe('GET /api/v1/dpl/feedback', function () {
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
