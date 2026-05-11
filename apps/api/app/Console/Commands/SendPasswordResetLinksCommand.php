<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;

/**
 * Replacement for the old `users:reset-default-password` command.
 *
 * The previous command actively reset user passwords to `DDMMYYYY`
 * (birth-date derived) — which is exactly the vulnerability pattern the
 * C-002 audit finding eliminated. Running it after this audit would
 * re-introduce the birthday-default attack surface across 14k+ users.
 *
 * This command replaces it with the CORRECT operation: dispatch password-
 * reset emails to the affected cohort so every user can set their own
 * password via the Password::sendResetLink flow.
 *
 * Usage:
 *   # preview: how many users would be targeted, don't send anything
 *   php artisan users:send-reset-links --dry-run
 *
 *   # actually send, rate-limited:
 *   php artisan users:send-reset-links --batch-size=50 --delay-ms=200
 *
 *   # only students or only dosen:
 *   php artisan users:send-reset-links --role=student
 *   php artisan users:send-reset-links --role=dosen
 *
 * Criteria for targeting:
 *   - user has `must_change_password=true` OR `password_changed_at IS NULL`
 *   - user has a valid email
 *   - user is `is_active=true`
 */
class SendPasswordResetLinksCommand extends Command
{
    protected $signature = 'users:send-reset-links
        {--role=all : student | dosen | all}
        {--batch-size=50 : How many emails to send per batch}
        {--delay-ms=200 : Sleep between sends to pace the mailer}
        {--dry-run : Count targets without sending}
        {--force : Bypass interactive confirmation}';

    protected $description = 'Dispatch password-reset links to users still on the default (unrotated) password. Replaces users:reset-default-password.';

    public function handle(): int
    {
        $role = $this->option('role');
        $batchSize = max(1, (int) $this->option('batch-size'));
        $delayMs = max(0, (int) $this->option('delay-ms'));
        $dryRun = (bool) $this->option('dry-run');

        $query = User::query()
            ->whereNotNull('email')
            ->where('is_active', true)
            ->where(function ($q) {
                $q->where('must_change_password', true)
                  ->orWhereNull('password_changed_at');
            });

        if ($role !== 'all') {
            $query->whereHas('roles', fn ($q) => $q->where('name', $role));
        }

        $total = (clone $query)->count();
        $this->line('');
        $this->info("Target cohort: <options=bold>{$total}</> users (role={$role})");

        if ($total === 0) {
            $this->info('Nothing to do.');
            return self::SUCCESS;
        }

        if ($dryRun) {
            $this->comment('[DRY RUN] No emails will be sent.');
            return self::SUCCESS;
        }

        if (! $this->option('force') && ! $this->confirm(
            "Send {$total} password-reset emails now?",
            false
        )) {
            $this->info('Aborted.');
            return self::FAILURE;
        }

        $sent = 0;
        $failed = 0;

        $query->chunkById($batchSize, function ($users) use (&$sent, &$failed, $delayMs) {
            foreach ($users as $user) {
                try {
                    Password::sendResetLink(['email' => $user->email]);
                    $sent++;
                } catch (\Throwable $e) {
                    $failed++;
                    Log::warning('users:send-reset-links — dispatch failed', [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'error' => $e->getMessage(),
                    ]);
                }

                if ($delayMs > 0) {
                    usleep($delayMs * 1000);
                }

                if (($sent + $failed) % 100 === 0) {
                    $this->info("  progress: sent={$sent} failed={$failed}");
                }
            }
        });

        $this->line('');
        $this->info("Done. sent={$sent} failed={$failed}");
        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
