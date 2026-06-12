<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class AvatarFileGuard extends Command
{
    protected $signature = 'avatar:file-guard {--fix : Mark missing avatars as rejected and clear avatar path}';

    protected $description = 'Audit DB avatar paths vs storage files; optionally fix missing files.';

    public function handle(): int
    {
        $users = User::query()
            ->whereNotNull('avatar')
            ->whereIn('avatar_moderation_status', ['approved', 'pending'])
            ->select(['id', 'name', 'avatar', 'avatar_moderation_status', 'avatar_moderation_reason'])
            ->get();

        $missing = 0;
        $fixed = 0;
        foreach ($users as $user) {
            if (Storage::disk('public')->exists($user->avatar)) {
                continue;
            }
            $missing++;
            $this->warn("[{$user->id}] {$user->name} {$user->avatar_moderation_status} missing: {$user->avatar}");

            if ($this->option('fix')) {
                $user->forceFill([
                    'avatar' => null,
                    'avatar_moderation_status' => 'rejected',
                    'avatar_moderation_reason' => 'File foto tidak ditemukan di server. Silakan upload ulang foto profil yang sesuai ketentuan.',
                    'avatar_moderation_reviewed_at' => now(),
                    'avatar_moderation_reviewed_by' => null,
                ])->save();
                $fixed++;
            }
        }

        $this->info(json_encode(['checked' => $users->count(), 'missing' => $missing, 'fixed' => $fixed]));

        return $missing > 0 && ! $this->option('fix') ? 1 : 0;
    }
}
