<?php

use App\Models\KKN\Dosen;
use App\Models\User;

describe('DPL Flow (E2E)', function () {

    beforeEach(function () {
        createActivePeriod('grading');
        $this->dplUser = createUserWithRole('dpl');
        $this->dosen = Dosen::factory()->create(['user_id' => $this->dplUser->id]);
    });

    it('dpl can view dashboard with expected structure', function () {
        $this->actingAs($this->dplUser)->getJson('/api/v1/dpl/dashboard')
            ->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure(['data' => ['groups', 'pending_reports', 'at_risk_students']]);
    });

    it('dpl can list groups', function () {
        $this->actingAs($this->dplUser)->getJson('/api/v1/dpl/groups')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('dpl can list daily reports', function () {
        $this->actingAs($this->dplUser)->getJson('/api/v1/dpl/daily-reports')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('dpl can list evaluations', function () {
        $this->actingAs($this->dplUser)->getJson('/api/v1/dpl/evaluations')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('dpl can list final reports', function () {
        $this->actingAs($this->dplUser)->getJson('/api/v1/dpl/final-reports')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('dpl can list monitoring visits', function () {
        $this->actingAs($this->dplUser)->getJson('/api/v1/dpl/monitoring')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('dpl can list leave requests', function () {
        $this->actingAs($this->dplUser)->getJson('/api/v1/dpl/leave-requests')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('dpl can view participant feedback', function () {
        $this->actingAs($this->dplUser)->getJson('/api/v1/dpl/feedback')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('dosen (non-dpl) can view dosen dashboard', function () {
        $dosenUser = createUserWithRole('dosen');
        Dosen::factory()->create(['user_id' => $dosenUser->id]);

        $this->actingAs($dosenUser)->getJson('/api/v1/dosen/dashboard')
            ->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure(['data' => ['dpl_periods', 'workshops', 'is_dpl']]);
    });

    it('dpl cannot submit monitoring without required fields', function () {
        $this->actingAs($this->dplUser)->postJson('/api/v1/dpl/monitoring', [])
            ->assertStatus(422);
    });

})->group('e2e', 'dpl');
