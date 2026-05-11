<?php

declare(strict_types=1);

use App\Http\Middleware\EnsureAdminAuthorization;
use Spatie\Permission\Models\Permission;

/**
 * Architecture test: setiap permission name yang di-reference di
 * EnsureAdminAuthorization::PERMISSION_MAP HARUS ada di DB setelah seeder
 * berjalan. Tanpa ini, faculty_admin (atau role non-superadmin lainnya)
 * akan hit Gate::authorize('undefined-permission') dan selalu 403.
 *
 * Audit finding: `view-participants` dan `view-grades` sempat missing dari
 * PermissionSeeder, tapi di-reference oleh PesertaKknController +
 * GradeController. Faculty_admin tidak bisa akses apapun → fix faculty
 * scoping di C1/C2 sia-sia. Test ini mencegah regresi serupa.
 */

beforeEach(function () {
    // Seeder dijalankan manual di sini supaya test bebas dari state
    // global. beforeAll di Pest.php hanya run RoleSeeder, tidak
    // PermissionSeeder, jadi kita seed di sini.
    \Illuminate\Support\Facades\Artisan::call('db:seed', [
        '--class' => 'PermissionSeeder',
        '--force' => true,
    ]);
});

it('every permission referenced in EnsureAdminAuthorization::PERMISSION_MAP exists in DB', function () {
    $referenced = collect(EnsureAdminAuthorization::PERMISSION_MAP)->values()->unique();
    $seeded = Permission::pluck('name')->all();

    $missing = $referenced->diff($seeded)->values()->all();

    expect($missing)->toBe(
        [],
        'Permission(s) missing dari seeder — Gate::authorize akan selalu fail untuk non-superadmin. Permission yang missing: '.implode(', ', $missing),
    );
});

it('faculty_admin role has read-only permissions needed for admin panel', function () {
    $facultyAdmin = \Spatie\Permission\Models\Role::where('name', 'faculty_admin')->first();
    expect($facultyAdmin)->not->toBeNull();

    $permissions = $facultyAdmin->permissions->pluck('name')->all();

    // Core read-only permissions yang diperlukan UI admin bagi faculty admin.
    foreach (['access-admin-panel', 'view-participants', 'view-grades', 'view-reports'] as $required) {
        expect($permissions)->toContain($required);
    }

    // Faculty_admin TIDAK boleh punya manage-settings (privileged admin only).
    expect($permissions)->not->toContain('manage-settings');
});

it('admin role has all permissions except manage-settings', function () {
    $admin = \Spatie\Permission\Models\Role::where('name', 'admin')->first();
    expect($admin)->not->toBeNull();

    $permissions = $admin->permissions->pluck('name')->all();

    expect($permissions)->toContain('manage-participants');
    expect($permissions)->toContain('view-participants');
    expect($permissions)->toContain('view-grades');
    expect($permissions)->not->toContain('manage-settings');
});

it('superadmin role has all permissions including manage-settings', function () {
    $superadmin = \Spatie\Permission\Models\Role::where('name', 'superadmin')->first();
    expect($superadmin)->not->toBeNull();

    $permissions = $superadmin->permissions->pluck('name')->all();

    expect($permissions)->toContain('manage-settings');
    expect($permissions)->toContain('manage-participants');
    expect($permissions)->toContain('view-participants');
});
