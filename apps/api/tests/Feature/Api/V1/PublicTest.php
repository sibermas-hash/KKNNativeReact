<?php

describe('Public API', function () {

    describe('Period Context', function () {
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

    describe('Public Endpoints', function () {
        it('public announcements accessible without auth', function () {
            $response = $this->getJson('/api/v1/public/announcements');

            $response->assertOk()
                ->assertJson(['success' => true]);
        });

        it('public locations accessible without auth', function () {
            $response = $this->getJson('/api/v1/public/locations');

            $response->assertOk()
                ->assertJson(['success' => true]);
        });

        it('public downloads accessible without auth', function () {
            $response = $this->getJson('/api/v1/public/downloads');

            $response->assertOk()
                ->assertJson(['success' => true]);
        });

        it('public home accessible without auth', function () {
            $response = $this->getJson('/api/v1/public/home');

            $response->assertOk()
                ->assertJson(['success' => true]);
        });

        it('verify certificate returns 404 for invalid token', function () {
            $response = $this->getJson('/api/v1/public/verify-certificate/invalid-token');

            $response->assertStatus(404)
                ->assertJson(['success' => false]);
        });
    });

})->group('public');
