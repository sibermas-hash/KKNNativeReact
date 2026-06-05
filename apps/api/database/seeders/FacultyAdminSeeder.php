<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\KKN\Fakultas;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

/**
 * Membuat akun real faculty_admin untuk setiap fakultas internal.
 *
 * Idempotent. Aman dijalankan ulang.
 *
 * Cara pakai:
 *   KKN_FACULTY_ADMIN_PASSWORD="..." php artisan db:seed --class=FacultyAdminSeeder
 *
 * Username/email default:
 *   admin-{kode-fakultas}
 *   admin-{kode-fakultas}@sibermas.uinsaizu.ac.id
 */
class FacultyAdminSeeder extends Seeder
{
    public function run(): void
    {
        $role = Role::firstOrCreate(['name' => 'faculty_admin', 'guard_name' => 'web']);
        $password = config('app.faculty_admin_password') ?: env('KKN_FACULTY_ADMIN_PASSWORD');
        $generatedPassword = null;

        if (! $password) {
            if (app()->environment('production')) {
                $this->command?->error('Set KKN_FACULTY_ADMIN_PASSWORD before running FacultyAdminSeeder in production.');
                throw new \RuntimeException('Missing KKN_FACULTY_ADMIN_PASSWORD in production.');
            }

            $generatedPassword = Str::password(16);
            $password = $generatedPassword;
        }

        $fakultasRows = Fakultas::query()
            ->where('code', '!=', 'EXT')
            ->orderBy('code')
            ->get(['id', 'code', 'nama', 'short_name']);

        if ($fakultasRows->isEmpty()) {
            $this->command?->warn('Tidak ada data fakultas internal. Jalankan sync/seed master fakultas dulu.');
            return;
        }

        $this->command?->info('Faculty admin accounts:');

        foreach ($fakultasRows as $fakultas) {
            $code = Str::lower((string) $fakultas->code);
            $slug = Str::slug($code, '-');
            $username = "admin-{$slug}";
            $email = "admin-{$slug}@sibermas.uinsaizu.ac.id";
            $name = 'Admin Fakultas '.($fakultas->short_name ?: $fakultas->nama);

            $user = User::firstOrNew(['username' => $username]);
            $isNew = ! $user->exists;

            $user->fill([
                'username' => $username,
                'email' => $email,
                'name' => $name,
                'fakultas_id' => $fakultas->id,
                'is_active' => true,
                'must_change_password' => true,
            ]);

            if ($isNew) {
                $user->password = Hash::make($password);
                $user->password_changed_at = null;
            }

            $user->save();
            $user->syncRoles([$role]);

            $this->command?->line(sprintf(
                '- %-20s %-45s fakultas=%s %s',
                $username,
                $email,
                $fakultas->code,
                $isNew ? 'CREATED' : 'UPDATED'
            ));
        }

        if ($generatedPassword) {
            $this->command?->warn("Generated password: {$generatedPassword}");
            $this->command?->warn('Catat password ini. User wajib ganti password saat login.');
        } else {
            $this->command?->info('Password source: KKN_FACULTY_ADMIN_PASSWORD. User wajib ganti password saat login.');
        }
    }
}
