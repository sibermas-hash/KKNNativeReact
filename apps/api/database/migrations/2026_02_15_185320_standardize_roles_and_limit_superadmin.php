<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * NOTE: Uses DB queries instead of User model to avoid SoftDeletes scope
     * referencing `deleted_at` column that doesn't exist yet at this point
     * in the migration sequence.
     */
    public function up(): void
    {
        // Standardize Roles
        $superadmin = Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'dpl', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);

        // Merge existing 'admin' role users into 'superadmin'
        $adminRole = Role::where('name', 'admin')->first();
        if ($adminRole) {
            // Get user IDs with admin role via pivot table (bypass Eloquent model)
            $userIds = DB::table('model_has_roles')
                ->where('role_id', $adminRole->id)
                ->where('model_type', 'App\\Models\\User')
                ->pluck('model_id');

            foreach ($userIds as $userId) {
                DB::table('model_has_roles')->insertOrIgnore([
                    'role_id' => $superadmin->id,
                    'model_type' => 'App\\Models\\User',
                    'model_id' => $userId,
                ]);
            }

            $adminRole->delete();
        }

        // Assign 'superadmin' to the first user if exists
        $firstUserExists = DB::table('users')->where('id', 1)->exists();
        if ($firstUserExists) {
            DB::table('model_has_roles')->insertOrIgnore([
                'role_id' => $superadmin->id,
                'model_type' => 'App\\Models\\User',
                'model_id' => 1,
            ]);
        }

        // Define Basic Permissions for RBAC
        $permissions = [
            'manage-evaluasi',
            'view-laporan',
            'review-activities',
            'manage-peserta_kkn',
            'create-laporan',
            'view-grades',
        ];

        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p, 'guard_name' => 'web']);
        }

        // Assign Permissions to DPL
        $dpl = Role::where('name', 'dpl')->first();
        $dpl?->syncPermissions([
            'manage-evaluasi',
            'view-laporan',
            'review-activities',
        ]);

        // Assign Permissions to Student
        $student = Role::where('name', 'student')->first();
        $student?->syncPermissions([
            'manage-peserta_kkn',
            'create-laporan',
            'view-grades',
        ]);
    }

    public function down(): void
    {
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    }
};
