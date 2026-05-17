<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Jobs\ValidateAvatarUploadJob;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

class AvatarRequeuePendingCommand extends Command
{
    protected $signature = 'avatar:requeue-pending
        {--limit=500 : Maximum pending avatars to requeue}
        {--dry-run : Show candidates without dispatching jobs}';

    protected $description = 'Requeue pending avatar validations that are still stuck in automatic verification.';

    public function handle(): int
    {
        $limit = max(1, (int) $this->option('limit'));
        $dryRun = (bool) $this->option('dry-run');

        $candidates = User::query()
            ->select(['id', 'avatar', 'avatar_moderation_reason', 'updated_at'])
            ->whereNotNull('avatar')
            ->where('avatar_moderation_status', 'pending')
            ->where('avatar_moderation_reason', 'Sedang diverifikasi otomatis oleh sistem.')
            ->orderBy('updated_at')
            ->limit($limit)
            ->get();

        if ($candidates->isEmpty()) {
            $this->info('Tidak ada avatar pending yang perlu direqueue.');

            return self::SUCCESS;
        }

        $queued = 0;
        $missing = 0;

        foreach ($candidates as $user) {
            if (! is_string($user->avatar) || $user->avatar === '') {
                continue;
            }

            if (! Storage::disk('public')->exists($user->avatar)) {
                $missing++;
                $this->warn("Lewati user #{$user->id}: file avatar tidak ditemukan ({$user->avatar}).");

                continue;
            }

            if (! $dryRun) {
                Queue::push((new ValidateAvatarUploadJob($user->id, $user->avatar))->onQueue('long'));
            }

            $queued++;
            $this->line(sprintf(
                '%s user #%d avatar %s',
                $dryRun ? 'DRY-RUN kandidat' : 'Direqueue',
                $user->id,
                $user->avatar
            ));
        }

        $summary = sprintf(
            '%s %d avatar pending. %d file hilang dilewati.',
            $dryRun ? 'Terdeteksi' : 'Berhasil merequeue',
            $queued,
            $missing
        );

        $this->info($summary);

        return self::SUCCESS;
    }
}
