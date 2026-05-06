<?php

use App\Models\KKN\Dosen;
use App\Models\User;

describe('API Response Envelope (E2E)', function () {

    it('all successful admin responses have success=true and data key', function () {
        $user = createUserWithRole('superadmin');

        $routes = [
            '/api/v1/admin/hub',
            '/api/v1/admin/dashboard',
            '/api/v1/admin/periode',
            '/api/v1/admin/mahasiswa',
            '/api/v1/public/announcements',
            '/api/v1/public/locations',
            '/api/v1/public/downloads',
            '/api/v1/public/home',
        ];

        foreach ($routes as $route) {
            $response = $this->actingAs($user)->getJson($route);
            $response->assertOk();
            expect($response->json('success'))->toBeTrue("Route {$route} missing success=true");
            expect(array_key_exists('data', $response->json()))->toBeTrue("Route {$route} missing data key");
        }
    });

    it('all unauthenticated requests return 401 with proper envelope', function () {
        $errorRoutes = [
            ['GET', '/api/v1/student/dashboard'],
            ['GET', '/api/v1/admin/hub'],
            ['GET', '/api/v1/dpl/dashboard'],
            ['GET', '/api/v1/period-context'],
        ];

        foreach ($errorRoutes as [$method, $route]) {
            $response = $this->json($method, $route);
            $response->assertStatus(401);
            expect($response->json('success'))->toBeFalse("Route {$route} missing success=false");
            expect($response->json('error.code'))->toBe('UNAUTHORIZED', "Route {$route} missing error.code=UNAUTHORIZED");
        }
    });

    it('403 responses have proper error envelope', function () {
        $student = createUserWithRole('student');

        $this->actingAs($student)->getJson('/api/v1/admin/hub')
            ->assertStatus(403)
            ->assertJson(['success' => false])
            ->assertJsonStructure(['error' => ['code']]);
    });

    it('404 responses have proper error envelope', function () {
        $this->getJson('/api/v1/public/verify-certificate/nonexistent-token-xyz')
            ->assertStatus(404)
            ->assertJson(['success' => false]);
    });

    it('422 responses include error code', function () {
        $this->postJson('/api/v1/auth/login', [])
            ->assertStatus(422)
            ->assertJson(['success' => false])
            ->assertJsonStructure(['error' => ['code']]);
    });

    it('server time endpoint returns unix timestamp', function () {
        $this->getJson('/api/server-time')
            ->assertOk()
            ->assertJsonStructure(['server_unix_ms']);
    });

    it('public announcements returns data', function () {
        $this->getJson('/api/v1/public/announcements')
            ->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure(['data']);
    });

    it('public home returns expected structure', function () {
        $this->getJson('/api/v1/public/home')
            ->assertOk()
            ->assertJson(['success' => true]);
    });

    it('profile incomplete returns proper error code for student', function () {
        $student = createUserWithRole('student');

        $this->actingAs($student)->getJson('/api/v1/student/dashboard')
            ->assertStatus(403)
            ->assertJsonPath('error.code', 'PROFILE_INCOMPLETE');
    });

})->group('e2e', 'envelope');
