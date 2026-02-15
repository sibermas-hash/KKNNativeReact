<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Standardize Roles
        $superadmin = Role::firstOrCreate(['name' => 'superadmin']);
        Role::firstOrCreate(['name' => 'dpl']);
        Role::firstOrCreate(['name' => 'student']);

        // Merge existing 'admin' role users into 'superadmin'
        $adminRole = Role::where('name', 'admin')->first();
        if ($adminRole) {
            $usersWithAdmin = User::role('admin')->get();
            foreach ($usersWithAdmin as $user) {
                $user->assignRole('superadmin');
            }
            // Optionally delete admin role to stick to the "3 role" rule
            $adminRole->delete();
        }

        // Assign 'superadmin' to the first user if none created yet
        $firstUser = User::find(1);
        if ($firstUser) {
            $firstUser->assignRole('superadmin');
        }

        // Define Basic Permissions for RBAC
        $permissions = [
            'manage-evaluations',
            'view-reports',
            'review-activities',
            'manage-registrations',
            'create-reports',
            'view-grades',
        ];

        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p]);
        }

        // Assign Permissions to DPL
        $dpl = Role::where('name', 'dpl')->first();
        $dpl?->syncPermissions([
            'manage-evaluations',
            'view-reports',
            'review-activities',
        ]);

        // Assign Permissions to Student
        $student = Role::where('name', 'student')->first();
        $student?->syncPermissions([
            'manage-registrations',
            'create-reports',
            'view-grades',
        ]);
    }

    public function down(): void
    {
        // No simple way to undo merging roles, but we can recreate the admin role
        Role::firstOrCreate(['name' => 'admin']);
    }
};