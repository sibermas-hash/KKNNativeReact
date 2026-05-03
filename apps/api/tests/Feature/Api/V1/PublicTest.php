<?php

describe('Public API', function () {

    describe('GET /api/v1/period-context', function () {
        it('returns 401 for unauthenticated', function () {
            $this->getJson('/api/v1/period-context')
                ->assertStatus(401);
        });
    });

    describe('Error Envelope', function () {
        it('returns proper envelope for 401', function () {
            $this->getJson('/api/v1/student/dashboard')
                ->assertStatus(401)
                ->assertJson([
                    'success' => false,
                    'error' => [
                        'code' => 'UNAUTHORIZED',
                    ],
                ]);
        });
    });

})->group('public');
