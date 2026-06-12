<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\User;
use App\Services\AvatarValidationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Retry all pending avatar moderations synchronously.
 * Designed to run via scheduler every 30 minutes.
 */
class RetryPendingAvatarModeration extends Command
{
    protected $signature = 'avatar:retry-pending {--limit=50 : Max photos to process} {--dry-run : Show what would be processed}';

    protected $description = 'Retry avatar moderation for all pending photos (sync, no queue needed)';

    public function handle(AvatarValidationService $validator): int
    {
        $limit = (int) $this->option('limit');
        $dryRun = (bool) $this->option('dry-run');

        $pending = User::where('avatar_moderation_status', 'pending')
            ->whereNotNull('avatar')
            ->orderBy('updated_at', 'asc')
            ->limit($limit)
            ->get();

        if ($pending->isEmpty()) {
            $this->info('No pending avatars to process.');

            return 0;
        }

        $this->info("Processing {$pending->count()} pending avatars...");

        $approved = 0;
        $rejected = 0;
        $failed = 0;

        foreach ($pending as $user) {
            $this->line("  [{$user->id}] {$user->name} — {$user->avatar}");

            if ($dryRun) {
                continue;
            }

            $absolutePath = storage_path('app/public/'.$user->avatar);

            // File missing — reject
            if (! file_exists($absolutePath)) {
                $user->forceFill([
                    'avatar' => null,
                    'avatar_moderation_status' => 'rejected',
                    'avatar_moderation_reason' => 'File foto tidak ditemukan di server.',
                    'avatar_moderation_reviewed_at' => now(),
                ])->save();
                $rejected++;
                $this->warn('    → REJECTED (file missing)');

                continue;
            }

            try {
                $result = $validator->validateAvatar($user->avatar);

                if ($result['is_valid']) {
                    $user->forceFill([
                        'avatar_moderation_status' => 'approved',
                        'avatar_moderation_reason' => $result['reason'],
                        'avatar_moderation_reviewed_at' => now(),
                    ])->save();
                    $approved++;
                    $this->info('    → APPROVED');
                } elseif ($result['requires_manual_review']) {
                    // Keep as pending — will retry next cycle
                    $failed++;
                    $this->warn('    → STILL PENDING (needs manual review)');
                } else {
                    Storage::disk('public')->delete($user->avatar);
                    $user->forceFill([
                        'avatar' => null,
                        'avatar_moderation_status' => 'rejected',
                        'avatar_moderation_reason' => $result['reason'] ?? 'Foto ditolak oleh sistem AI.',
                        'avatar_moderation_reviewed_at' => now(),
                    ])->save();
                    $rejected++;
                    $this->warn('    → REJECTED: '.($result['reason'] ?? 'N/A'));
                }
            } catch (\Throwable $e) {
                $failed++;
                $this->error('    → ERROR: '.$e->getMessage());
                Log::error('RetryPendingAvatarModeration error', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }

            // Rate limit — 1 second between calls
            usleep(1000000);
        }

        $summary = "Done: {$approved} approved, {$rejected} rejected, {$failed} failed/pending";
        $this->info($summary);
        Log::info('RetryPendingAvatarModeration', compact('approved', 'rejected', 'failed'));

        return 0;
    }
}
