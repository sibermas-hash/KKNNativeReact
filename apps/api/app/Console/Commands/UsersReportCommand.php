<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\KKN\Dosen;
use App\Models\KKN\Mahasiswa;
use App\Models\User;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;

/**
 * Diagnostic: report on user/role state.
 *
 * Audit follow-up (porting the old `check_users.php` debug script as a
 * proper artisan command for the new stack). Useful for ops to answer
 * questions like "how many students have incomplete profiles?" or
 * "which accounts are dormant?" without opening tinker.
 *
 * Usage:
 *   php artisan users:report                 # summary only
 *   php artisan users:report --stale=60      # list accounts with no activity in 60 days
 *   php artisan users:report --json          # machine-readable
 */
class UsersReportCommand extends Command
{
    protected $signature = 'users:report
        {--stale=90 : Report accounts dormant for this many days}
        {--json : Emit the report as JSON}';

    protected $description = 'Report on user counts, role distribution, profile completeness, dormant accounts.';

    public function handle(): int
    {
        $staleDays = max(1, (int) $this->option('stale'));
        $staleThreshold = now()->subDays($staleDays);

        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->count();
        $inactiveUsers = $totalUsers - $activeUsers;

        $unrotatedPasswords = User::where(function ($q) {
            $q->where('must_change_password', true)
                ->orWhereNull('password_changed_at');
        })->count();

        $roles = Role::withCount('users')->get()
            ->map(fn ($r) => ['role' => $r->name, 'user_count' => $r->users_count])
            ->sortByDesc('user_count')
            ->values()
            ->toArray();

        $mahasiswaTotal = Mahasiswa::count();
        $mahasiswaMissingNik = Mahasiswa::whereNull('nik')->count();
        $mahasiswaMissingEmail = Mahasiswa::whereHas('user', fn ($q) => $q->whereNull('email'))->count();
        $mahasiswaNeverSynced = Mahasiswa::whereNull('master_synced_at')->count();

        $dosenTotal = Dosen::count();
        $dosenMissingEmail = Dosen::whereHas('user', fn ($q) => $q->whereNull('email'))->count();
        $dosenNeverSynced = Dosen::whereNull('master_synced_at')->count();

        // Dormant accounts = never-updated users past the staleness threshold.
        // Using updated_at as a coarse activity proxy; last_login_at is not
        // tracked by this codebase (Sanctum tokens have their own last_used_at).
        $staleUsers = User::where('updated_at', '<', $staleThreshold)
            ->where('is_active', true)
            ->count();

        $report = [
            'generated_at' => now()->toIso8601String(),
            'totals' => [
                'users' => $totalUsers,
                'active' => $activeUsers,
                'inactive' => $inactiveUsers,
                'unrotated_passwords' => $unrotatedPasswords,
                'stale_users_last_'.$staleDays.'_days' => $staleUsers,
            ],
            'roles' => $roles,
            'mahasiswa' => [
                'total' => $mahasiswaTotal,
                'missing_nik' => $mahasiswaMissingNik,
                'missing_email' => $mahasiswaMissingEmail,
                'never_synced_from_siakad' => $mahasiswaNeverSynced,
            ],
            'dosen' => [
                'total' => $dosenTotal,
                'missing_email' => $dosenMissingEmail,
                'never_synced_from_siakad' => $dosenNeverSynced,
            ],
        ];

        if ($this->option('json')) {
            $this->line(json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            return self::SUCCESS;
        }

        $this->renderHuman($report, $staleDays);

        return self::SUCCESS;
    }

    private function renderHuman(array $report, int $staleDays): void
    {
        $this->line('');
        $this->line('<fg=cyan>╔══════════════════════════════════════════════╗</>');
        $this->line('<fg=cyan>║</>   <options=bold>SIBERMAS — Users Report</>                 <fg=cyan>║</>');
        $this->line('<fg=cyan>╚══════════════════════════════════════════════╝</>');
        $this->line('');

        $totals = $report['totals'];
        $this->line(sprintf('  Total users       : <options=bold>%d</>', $totals['users']));
        $this->line(sprintf('  Active            : <fg=green>%d</>', $totals['active']));
        $this->line(sprintf('  Inactive          : <fg=yellow>%d</>', $totals['inactive']));

        if ($totals['unrotated_passwords'] > 0) {
            $this->warn(sprintf('  Unrotated defaults: %d   ← have not changed their initial password', $totals['unrotated_passwords']));
        } else {
            $this->line('  Unrotated defaults: 0');
        }

        $staleKey = 'stale_users_last_'.$staleDays.'_days';
        if ($totals[$staleKey] > 0) {
            $this->warn(sprintf("  Stale > {$staleDays}d     : %d   ← no updated_at change in {$staleDays}d", $totals[$staleKey]));
        }

        $this->line('');
        $this->info('  Roles');
        $this->table(['Role', 'Users'], array_map(
            fn ($r) => [$r['role'], $r['user_count']],
            $report['roles']
        ));

        $m = $report['mahasiswa'];
        $this->info('  Mahasiswa');
        $this->line(sprintf('    total                    : <options=bold>%d</>', $m['total']));
        if ($m['missing_nik'] > 0) {
            $this->warn(sprintf('    missing NIK              : %d', $m['missing_nik']));
        }
        if ($m['missing_email'] > 0) {
            $this->warn(sprintf('    missing email (user)     : %d', $m['missing_email']));
        }
        if ($m['never_synced_from_siakad'] > 0) {
            $this->warn(sprintf('    never synced from SIAKAD : %d', $m['never_synced_from_siakad']));
        }

        $d = $report['dosen'];
        $this->line('');
        $this->info('  Dosen');
        $this->line(sprintf('    total                    : <options=bold>%d</>', $d['total']));
        if ($d['missing_email'] > 0) {
            $this->warn(sprintf('    missing email (user)     : %d', $d['missing_email']));
        }
        if ($d['never_synced_from_siakad'] > 0) {
            $this->warn(sprintf('    never synced from SIAKAD : %d', $d['never_synced_from_siakad']));
        }

        $this->line('');
    }
}
