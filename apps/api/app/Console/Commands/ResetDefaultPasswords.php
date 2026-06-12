<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * DEPRECATED & NEUTRALIZED (audit follow-up to C-002).
 *
 * This command previously reset user passwords to `DDMMYYYY` (birth-date
 * format) — exactly the vulnerability pattern the C-002 audit finding
 * eliminated. Running it would re-introduce the birthday-default attack
 * surface across every synced account.
 *
 * The command now hard-refuses and points operators at the replacement,
 * `users:send-reset-links`, which dispatches `Password::sendResetLink`
 * to the same cohort without creating guessable defaults.
 */
class ResetDefaultPasswords extends Command
{
    protected $signature = 'users:reset-default-password
                            {--role=all}
                            {--force}';

    protected $description = '[DEPRECATED] Use users:send-reset-links instead. Refuses to run.';

    public function handle(): int
    {
        $this->error('This command is deprecated and disabled (audit C-002).');
        $this->line('');
        $this->line('Resetting user passwords to DDMMYYYY is the exact vulnerability');
        $this->line('the 2026-05-09 audit eliminated. Do NOT re-introduce it.');
        $this->line('');
        $this->info('Use instead:');
        $this->line('  <options=bold>php artisan users:send-reset-links --dry-run</>');
        $this->line('  <options=bold>php artisan users:send-reset-links --batch-size=50</>');
        $this->line('');
        $this->line('See SendPasswordResetLinksCommand.php for details.');

        return self::FAILURE;
    }
}
