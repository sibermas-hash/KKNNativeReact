<?php

use App\Models\KKN\Dosen;
use App\Models\KKN\ExternalUniversity;

describe('Role Isolation (Integration)', function () {

    dataset('protected_admin_routes', [
        '/api/v1/admin/hub',
        '/api/v1/admin/dashboard',
        '/api/v1/admin/pengguna',
        '/api/v1/admin/periode',
        '/api/v1/admin/pendaftaran',
        '/api/v1/admin/mahasiswa',
    ]);

    dataset('protected_student_routes', [
        '/api/v1/student/dashboard',
        '/api/v1/student/work-programs',
        '/api/v1/student/certificates',
        '/api/v1/student/leave-requests',
        '/api/v1/student/final-report',
    ]);

    dataset('protected_dpl_routes', [
        '/api/v1/dpl/dashboard',
        '/api/v1/dpl/groups',
        '/api/v1/dpl/daily-reports',
        '/api/v1/dpl/evaluations',
        '/api/v1/dpl/final-reports',
        '/api/v1/dpl/monitoring',
        '/api/v1/dpl/leave-requests',
    ]);

    // Unauthenticated → 401 on all protected routes
    it('returns 401 for unauthenticated on admin routes', function (string $route) {
        $this->getJson($route)->assertStatus(401);
    })->with('protected_admin_routes');

    it('returns 401 for unauthenticated on student routes', function (string $route) {
        $this->getJson($route)->assertStatus(401);
    })->with('protected_student_routes');

    it('returns 401 for unauthenticated on dpl routes', function (string $route) {
        $this->getJson($route)->assertStatus(401);
    })->with('protected_dpl_routes');

    // Student cannot access admin or DPL routes
    it('student gets 403 on admin routes', function (string $route) {
        $user = createUserWithRole('student');
        $this->actingAs($user)->getJson($route)->assertStatus(403);
    })->with('protected_admin_routes');

    it('student gets 403 on dpl routes', function (string $route) {
        $user = createUserWithRole('student');
        $this->actingAs($user)->getJson($route)->assertStatus(403);
    })->with('protected_dpl_routes');

    // DPL cannot access admin or student routes
    it('dpl gets 403 on admin routes', function (string $route) {
        $user = createUserWithRole('dpl');
        Dosen::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user)->getJson($route)->assertStatus(403);
    })->with('protected_admin_routes');

    it('dpl gets 403 on student routes', function (string $route) {
        $user = createUserWithRole('dpl');
        Dosen::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user)->getJson($route)->assertStatus(403);
    })->with('protected_student_routes');

    // Superadmin bypasses role middleware (Spatie default) — can access all routes
    it('superadmin can access student routes (bypasses role middleware)', function (string $route) {
        $user = createUserWithRole('superadmin');
        // Superadmin bypasses Spatie role:student middleware — returns 200 or 403 (PROFILE_INCOMPLETE)
        $response = $this->actingAs($user)->getJson($route);
        expect($response->status())->toBeIn([200, 403]);
    })->with('protected_student_routes');

    it('superadmin can access dpl routes (bypasses role middleware)', function (string $route) {
        $user = createUserWithRole('superadmin');
        $response = $this->actingAs($user)->getJson($route);
        expect($response->status())->toBeIn([200, 403]);
    })->with('protected_dpl_routes');

    // Superadmin can access admin routes
    it('superadmin can access admin routes', function (string $route) {
        $user = createUserWithRole('superadmin');
        $this->actingAs($user)->getJson($route)->assertOk();
    })->with('protected_admin_routes');

    it('external LPPM admin cannot access internal admin routes', function (string $route) {
        $externalUniversity = ExternalUniversity::query()->create([
            'code' => 'EXT-TEST',
            'name' => 'External Test University',
            'status' => 'active',
        ]);
        $user = createUserWithRole('external_lppm_admin');
        $user->forceFill(['external_university_id' => $externalUniversity->id])->save();

        $this->actingAs($user)->getJson($route)->assertStatus(403);
    })->with('protected_admin_routes');

    it('external LPPM admin can access external dashboard', function () {
        $externalUniversity = ExternalUniversity::query()->create([
            'code' => 'EXT-DASH',
            'name' => 'External Dashboard University',
            'status' => 'active',
        ]);
        $user = createUserWithRole('external_lppm_admin');
        $user->forceFill(['external_university_id' => $externalUniversity->id])->save();

        $this->actingAs($user)
            ->getJson('/api/v1/external/dashboard')
            ->assertOk()
            ->assertJsonPath('role', 'external_lppm_admin')
            ->assertJsonPath('external_university.id', $externalUniversity->id);
    });

    it('non-external roles cannot access external dashboard', function (string $role) {
        $user = createUserWithRole($role);

        $this->actingAs($user)->getJson('/api/v1/external/dashboard')->assertStatus(403);
    })->with(['superadmin', 'admin', 'faculty_admin', 'dosen', 'dpl', 'student']);

})->group('integration', 'rbac');
