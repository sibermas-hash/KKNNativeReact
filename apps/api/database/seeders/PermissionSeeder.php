<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // NOTE: Permissions di sini HARUS cocok dengan referensi di
        // App\Http\Middleware\EnsureAdminAuthorization::PERMISSION_MAP.
        // Ada regression test (AdminPermissionCoverageTest) yang memastikan
        // setiap permission name yang di-reference sudah ter-seed.
        $permissions = [
            // Master Data
            'manage-master-data',

            // User Management
            'manage-users',
            'sync-data',
            'manageDplAssignment',

            // Grades (read-only vs write distinction)
            'view-grades',
            'manage-grades',

            // Participants (read-only vs write distinction)
            'view-participants',
            'manage-participants',
            'transfer-students',

            // Groups
            'manage-groups',

            // DPL
            'manage-dpl',

            // Content
            'manage-content',
            'manage-announcements',

            // Audit Logs
            'view-audit-logs',

            // Reports
            'manage-reports',
            'view-reports',

            // Settings
            'manage-settings',

            // Database Sync
            'manage-database-sync',

            // Workshops
            'manage-workshops',

            // KKN Operations
            'manage-kkn-operations',

            // Eligibility
            'manage-eligibility',

            // Requirements
            'manage-requirements',

            // Admin Panel Access
            'access-admin-panel',
            'access-dosen-panel',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // ── Role assignments ────────────────────────────────────────────
        // Superadmin: semua permission
        $superadmin = Role::where('name', 'superadmin')->first();
        if ($superadmin) {
            $superadmin->syncPermissions($permissions);
        }

        // Admin (LPPM Internal): operational KKN only.
        // TIDAK dapat: manage-settings, manage-users, manage-database-sync,
        // manage-announcements (semua ini superadmin-only, route pun
        // di-guard role:superadmin atau policy return false).
        $admin = Role::where('name', 'admin')->first();
        if ($admin) {
            $admin->syncPermissions([
                'access-admin-panel',
                'manage-master-data',
                'view-grades',
                'manage-grades',
                'view-participants',
                'manage-participants',
                'transfer-students',
                'manage-groups',
                'manage-dpl',
                'manageDplAssignment',
                'manage-content',
                'view-audit-logs',
                'manage-reports',
                'view-reports',
                'manage-workshops',
                'manage-kkn-operations',
                'manage-eligibility',
                'manage-requirements',
                'sync-data',
            ]);
        }

        // Faculty Admin: READ-ONLY. Lihat data mahasiswa/nilai/kelompok di
        // fakultasnya. Tidak boleh mutate. Controller-level guard sudah
        // mem-block PATCH/POST untuk faculty_admin (lihat PesertaKknController,
        // KelompokKknAdminController, GradeController).
        $facultyAdmin = Role::where('name', 'faculty_admin')->first();
        if ($facultyAdmin) {
            $facultyAdmin->syncPermissions([
                'access-admin-panel',
                'view-participants',
                'view-grades',
                'view-reports',
                'view-audit-logs',
                // Masih perlu permission level-koleksi untuk endpoint admin
                // yang fundamental (kelompok listing/search, DPL list).
                // Controller filter dengan faculty scoping.
                'manage-groups',
                'manage-dpl',
                'manage-master-data',
            ]);
        }

        // Dosen/DPL: akses panel dosen. Permission detail di cek level controller
        // (by pivot dpl_kelompok).
        foreach (['dosen', 'dpl'] as $roleName) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                $role->syncPermissions(['access-dosen-panel']);
            }
        }

        // Student: tidak pakai admin panel, no permission needed di sini.
    }
}
