<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\User;
use App\Services\AvatarValidationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class RevalidateApprovedAvatars extends Command
{
    protected $signature = 'avatar:revalidate-approved {--limit=200 : Max photos} {--reason=Bulk approved - queue worker unavailable : Match reason} {--dry-run : No DB/file changes}';

    protected $description = 'Revalidate suspicious approved avatars; reject/delete invalid photos so users must upload again.';

    public function handle(AvatarValidationService $validator): int
    {
        $limit = max(1, (int) $this->option('limit'));
        $reason = (string) $this->option('reason');
        $dryRun = (bool) $this->option('dry-run');

        $q = User::query()
            ->where('avatar_moderation_status', 'approved')
            ->whereNotNull('avatar')
            ->whereNotNull('avatar_moderation_reason')
            ->orderBy('updated_at', 'asc')
            ->limit($limit);

        if ($reason !== '') {
            $q->where('avatar_moderation_reason', 'like', '%'.$reason.'%');
        }

        $users = $q->get();
        $this->info('Revalidating '.$users->count().' approved avatars'.($dryRun ? ' (dry-run)' : '').'...');

        $approved = $rejected = $pending = $missing = $errors = 0;
        $csv = storage_path('logs/avatar-revalidate-approved-'.now()->format('Ymd-His').'.csv');
        $fh = fopen($csv, 'w');
        fputcsv($fh, ['user_id','name','avatar','old_reason','decision','new_reason']);

        foreach ($users as $user) {
            $oldAvatar = $user->avatar;
            $oldReason = $user->avatar_moderation_reason;
            $abs = storage_path('app/public/'.$oldAvatar);
            $this->line("[{$user->id}] {$user->name} — {$oldAvatar}");

            try {
                if (! file_exists($abs)) {
                    $decision = 'rejected_missing';
                    $newReason = 'File foto tidak ditemukan di server. Silakan upload ulang foto profil yang sesuai ketentuan.';
                    if (! $dryRun) {
                        $user->forceFill([
                            'avatar' => null,
                            'avatar_moderation_status' => 'rejected',
                            'avatar_moderation_reason' => $newReason,
                            'avatar_moderation_reviewed_at' => now(),
                            'avatar_moderation_reviewed_by' => null,
                        ])->save();
                    }
                    $missing++;
                } else {
                    $result = $validator->validateAvatar($oldAvatar);
                    if (! (bool) $result['is_valid'] && ! (bool) $result['requires_manual_review']) {
                        $decision = 'rejected_invalid';
                        $newReason = ($result['reason'] ?? 'Foto tidak memenuhi ketentuan.').' Silakan upload ulang foto profil yang sesuai ketentuan.';
                        if (! $dryRun) {
                            Storage::disk('public')->delete($oldAvatar);
                            $user->forceFill([
                                'avatar' => null,
                                'avatar_moderation_status' => 'rejected',
                                'avatar_moderation_reason' => $newReason,
                                'avatar_moderation_reviewed_at' => now(),
                                'avatar_moderation_reviewed_by' => null,
                            ])->save();
                        }
                        $rejected++;
                    } elseif ((bool) $result['requires_manual_review']) {
                        $decision = 'pending_manual';
                        $newReason = $result['reason'] ?? 'AI tidak tersedia/hasil tidak pasti. Perlu verifikasi admin.';
                        if (! $dryRun) {
                            $user->forceFill([
                                'avatar_moderation_status' => 'pending',
                                'avatar_moderation_reason' => $newReason,
                                'avatar_moderation_reviewed_at' => null,
                                'avatar_moderation_reviewed_by' => null,
                            ])->save();
                        }
                        $pending++;
                    } else {
                        $decision = 'approved_revalidated';
                        $newReason = 'Foto memenuhi ketentuan berdasarkan revalidasi AI.';
                        if (! $dryRun) {
                            $user->forceFill([
                                'avatar_moderation_status' => 'approved',
                                'avatar_moderation_reason' => $newReason,
                                'avatar_moderation_reviewed_at' => now(),
                                'avatar_moderation_reviewed_by' => null,
                            ])->save();
                        }
                        $approved++;
                    }
                }

                fputcsv($fh, [$user->id, $user->name, $oldAvatar, $oldReason, $decision, $newReason]);
                $this->line("  → {$decision}: {$newReason}");
            } catch (\Throwable $e) {
                $errors++;
                fputcsv($fh, [$user->id, $user->name, $oldAvatar, $oldReason, 'error', $e->getMessage()]);
                Log::error('avatar:revalidate-approved error', ['user_id'=>$user->id, 'error'=>$e->getMessage()]);
                $this->error('  → ERROR: '.$e->getMessage());
            }

            usleep(250000);
        }

        fclose($fh);
        $summary = compact('approved','rejected','pending','missing','errors','csv');
        $this->info('Done: '.json_encode($summary));
        Log::info('avatar:revalidate-approved done', $summary);
        return $errors > 0 ? 1 : 0;
    }
}
