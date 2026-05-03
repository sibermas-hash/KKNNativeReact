<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // Master Data
            'manage-master-data',

            // User Management
            'manage-users',
            'sync-data',
            'manageDplAssignment',

            // Grades
            'manage-grades',

            // Participants
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

        // Assign all permissions to superadmin
        $superadmin = Role::where('name', 'superadmin')->first();
        if ($superadmin) {
            $superadmin->givePermissionTo($permissions);
        }

        // Admin gets all except system settings
        $admin = Role::where('name', 'admin')->first();
        if ($admin) {
            $adminPermissions = array_filter($permissions, fn ($p) => $p !== 'manage-settings');
            $admin->givePermissionTo($adminPermissions);
        }
    }
}
