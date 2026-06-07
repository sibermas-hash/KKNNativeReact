<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * SuperAdminSeeder — Seeder mandiri untuk membuat akun superadmin.
 *
 * Bisa dijalankan di semua environment (local, staging, production).
 * Aman dijalankan berulang kali (idempotent).
 *
 * Cara pakai:
 *   php artisan db:seed --class=SuperAdminSeeder
 *
 * Opsional: set KKN_SUPERADMIN_* di .env untuk menentukan akun bootstrap.
 * Seeder membaca nilainya via config('app.bootstrap_superadmin') supaya tetap
 * bekerja saat production memakai `php artisan config:cache`.
 */
class SuperAdminSeeder extends Seeder
{
    private const SUPERADMIN_EMAIL = 'superadmin@sibermas.uinsaizu.ac.id';

    private const SUPERADMIN_USERNAME = 'superadmin';

    private const SUPERADMIN_NAME = 'Super Administrator SIBERMAS';

    public function run(): void
    {
        $this->ensureRolesExist();
        $this->ensurePermissionsExist();
        $this->createSuperAdmin();
    }

    /**
     * Pastikan semua role tersedia sebelum assign.
     */
    private function ensureRolesExist(): void
    {
        $roles = ['superadmin', 'admin', 'faculty_admin', 'external_lppm_admin', 'dosen', 'dpl', 'student'];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        $this->command?->info('✅ Semua role tersedia.');
    }

    /**
     * Pastikan semua permission tersedia dan di-assign ke superadmin role.
     */
    private function ensurePermissionsExist(): void
    {
        $permissions = [
            'manage-master-data',
            'manage-users',
            'sync-data',
            'manageDplAssignment',
            'manage-grades',
            'manage-participants',
            'transfer-students',
            'manage-groups',
            'manage-dpl',
            'manage-content',
            'manage-announcements',
            'view-audit-logs',
            'manage-reports',
            'view-reports',
            'manage-settings',
            'manage-database-sync',
            'manage-workshops',
            'manage-kkn-operations',
            'manage-eligibility',
            'manage-requirements',
            'access-admin-panel',
            'access-dosen-panel',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Assign semua permission ke role superadmin
        $superadminRole = Role::where('name', 'superadmin')->first();
        if ($superadminRole) {
            $superadminRole->syncPermissions($permissions);
        }

        $this->command?->info('✅ Semua permission tersedia dan di-assign ke superadmin.');
    }

    /**
     * Buat atau perbarui akun superadmin.
     */
    private function createSuperAdmin(): void
    {
        $bootstrap = (array) config('app.bootstrap_superadmin', []);
        $envPassword = $bootstrap['password'] ?? null;
        $username = $bootstrap['username'] ?? self::SUPERADMIN_USERNAME;
        $email = $bootstrap['email'] ?? self::SUPERADMIN_EMAIL;
        $name = $bootstrap['name'] ?? self::SUPERADMIN_NAME;

        // L-001 fix: In production, do NOT allow creating a new superadmin
        // with an auto-generated password printed to stdout — deploy logs
        // may be captured/shipped to aggregators. Require the operator to
        // set KKN_SUPERADMIN_PASSWORD explicitly. Read from cached config
        // rather than raw env() so the guard still works after config:cache.
        $existing = User::where('email', $email)->orWhere('username', $username)->exists();

        if (app()->environment('production') && ! $existing && ! $envPassword) {
            $this->command?->error(
                'SuperAdminSeeder refused to run in production without KKN_SUPERADMIN_PASSWORD. '.
                'Set the env var before running this seeder, e.g.: '.
                'KKN_SUPERADMIN_PASSWORD="…" php artisan db:seed --class=SuperAdminSeeder'
            );
            throw new \RuntimeException('Missing KKN_SUPERADMIN_PASSWORD in production.');
        }

        $plainPassword = $envPassword ?: Str::password(16);

        $user = User::firstOrNew(['username' => $username]);
        $isNewUser = ! $user->exists;

        $user->fill([
            'username' => $username,
            'email' => $email,
            'name' => $name,
            'is_active' => true,
            'must_change_password' => ! $envPassword,
        ]);

        // Set password hanya jika: (1) user baru, atau (2) password diberikan via env
        if ($isNewUser || $envPassword) {
            $user->password = Hash::make($plainPassword);
            $user->password_changed_at = $envPassword ? now() : null;
        }

        $user->save();

        // Assign role superadmin
        if (! $user->hasRole('superadmin')) {
            $user->assignRole('superadmin');
        }

        // Output info
        $this->command?->newLine();
        $this->command?->info('╔══════════════════════════════════════════════════╗');
        $this->command?->info('║        🔐 SUPERADMIN ACCOUNT READY               ║');
        $this->command?->info('╠══════════════════════════════════════════════════╣');

        if ($isNewUser) {
            $this->command?->warn('║  Status  : BARU DIBUAT                           ║');
            $this->command?->warn("║  Email   : {$email}");
            $this->command?->warn("║  Username: {$username}");
            $this->command?->warn("║  Password: {$plainPassword}                   ║");
            if (! $envPassword) {
                $this->command?->error('║  ⚠ CATAT PASSWORD DI ATAS — tidak ditampilkan lagi! ║');
            }
        } elseif ($envPassword) {
            $this->command?->info('║  Status  : PASSWORD DIPERBARUI                   ║');
            $this->command?->info("║  Email   : {$email}");
        } else {
            $this->command?->info('║  Status  : SUDAH ADA (tidak diubah)              ║');
            $this->command?->info("║  Email   : {$email}");
        }

        $this->command?->info('╚══════════════════════════════════════════════════╝');
        $this->command?->newLine();
    }
}
