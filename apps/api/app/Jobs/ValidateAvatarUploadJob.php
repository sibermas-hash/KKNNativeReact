<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\AvatarValidationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ValidateAvatarUploadJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public array $backoff = [30, 120, 300];

    public function __construct(
        public int $userId,
        public string $path,
    ) {}

    public function handle(AvatarValidationService $validator): void
    {
        $user = User::query()->find($this->userId);

        if (! $user instanceof User) {
            return;
        }

        if ($user->avatar !== $this->path || $user->avatar_moderation_status !== 'pending') {
            return;
        }

        $result = $validator->validateAvatar($this->path);
        $user->refresh();

        if ($user->avatar !== $this->path || $user->avatar_moderation_status !== 'pending') {
            return;
        }

        if (! $result['is_valid'] && ! $result['requires_manual_review']) {
            Storage::disk('public')->delete($this->path);

            $user->forceFill([
                'avatar' => null,
                'avatar_moderation_status' => 'rejected',
                'avatar_moderation_reason' => $result['reason'] ?? 'Foto ditolak oleh sistem AI.',
                'avatar_moderation_reviewed_at' => now(),
                'avatar_moderation_reviewed_by' => null,
            ])->save();

            ActivityLogger::log('avatar_rejected', 'failed', $user->id, [
                'reason' => $result['reason'] ?? 'Foto ditolak oleh sistem AI.',
            ]);

            return;
        }

        $user->forceFill([
            'avatar_moderation_status' => $result['requires_manual_review'] ? 'pending' : 'approved',
            'avatar_moderation_reason' => $result['requires_manual_review']
                ? 'Server AI tidak tersedia, menunggu verifikasi admin.'
                : null,
            'avatar_moderation_reviewed_at' => $result['requires_manual_review'] ? null : now(),
            'avatar_moderation_reviewed_by' => null,
        ])->save();
    }

    public function failed(\Throwable $e): void
    {
        Log::error('ValidateAvatarUploadJob exhausted retries', [
            'user_id' => $this->userId,
            'avatar' => $this->path,
            'error' => $e->getMessage(),
        ]);
    }
}
