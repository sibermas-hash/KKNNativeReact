<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CleanupStaleDataCommand extends Command
{
    protected $signature = 'cleanup:stale-data
                            {--dry-run : Show what would be deleted without actually deleting}
                            {--quiet-log : Suppress console output, only log}';

    protected $description = 'Purge stale tokens, expired sessions, old cache entries, and other junk data';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $results = [];

        // 1. Password reset tokens older than 24 hours
        $cutoff24h = now()->subHours(24);
        $staleResets = DB::table('password_reset_tokens')
            ->where('created_at', '<', $cutoff24h)
            ->count();
        if (! $dryRun && $staleResets > 0) {
            DB::table('password_reset_tokens')
                ->where('created_at', '<', $cutoff24h)
                ->delete();
        }
        $results['password_reset_tokens (>24h)'] = $staleResets;

        // 2. Personal access tokens: never used OR inactive >30 days
        $staleTokens = DB::table('personal_access_tokens')
            ->where(function ($q) {
                $q->whereNull('last_used_at')
                    ->orWhere('last_used_at', '<', now()->subDays(30));
            })
            ->count();
        if (! $dryRun && $staleTokens > 0) {
            DB::table('personal_access_tokens')
                ->where(function ($q) {
                    $q->whereNull('last_used_at')
                        ->orWhere('last_used_at', '<', now()->subDays(30));
                })
                ->delete();
        }
        $results['access_tokens (stale >30d)'] = $staleTokens;

        // 3. Expired sessions (>7 days)
        $staleSessions = DB::table('sessions')
            ->where('last_activity', '<', time() - (86400 * 7))
            ->count();
        if (! $dryRun && $staleSessions > 0) {
            DB::table('sessions')
                ->where('last_activity', '<', time() - (86400 * 7))
                ->delete();
        }
        $results['sessions (>7d)'] = $staleSessions;

        // 4. Expired cache entries
        $expiredCache = DB::table('cache')
            ->where('expiration', '<', time())
            ->count();
        if (! $dryRun && $expiredCache > 0) {
            DB::table('cache')
                ->where('expiration', '<', time())
                ->delete();
        }
        $results['cache (expired)'] = $expiredCache;

        // 5. Old user activity logs (>90 days)
        $oldActivityLogs = DB::table('user_activity_logs')
            ->where('created_at', '<', now()->subDays(90))
            ->count();
        if (! $dryRun && $oldActivityLogs > 0) {
            DB::table('user_activity_logs')
                ->where('created_at', '<', now()->subDays(90))
                ->delete();
        }
        $results['activity_logs (>90d)'] = $oldActivityLogs;

        // 6. Old sync logs (>60 days)
        $oldSyncLogs = DB::table('sync_logs')
            ->where('created_at', '<', now()->subDays(60))
            ->count();
        if (! $dryRun && $oldSyncLogs > 0) {
            DB::table('sync_logs')
                ->where('created_at', '<', now()->subDays(60))
                ->delete();
        }
        $results['sync_logs (>60d)'] = $oldSyncLogs;

        // Summary
        $totalCleaned = array_sum($results);
        $mode = $dryRun ? '[DRY-RUN]' : '[CLEANED]';

        $logMsg = "cleanup:stale-data {$mode} — ";
        $parts = [];
        foreach ($results as $key => $count) {
            if ($count > 0) {
                $parts[] = "{$key}: {$count}";
            }
        }

        if (empty($parts)) {
            $logMsg .= 'nothing to clean';
        } else {
            $logMsg .= implode(', ', $parts)." | total: {$totalCleaned}";
        }

        Log::info($logMsg);

        if (! $this->option('quiet-log')) {
            $this->info('');
            $this->info("  {$mode} Cleanup Results:");
            $this->info('  '.str_repeat('─', 50));
            foreach ($results as $key => $count) {
                $icon = $count > 0 ? '🗑️ ' : '✅';
                $this->info("  {$icon} {$key}: {$count}");
            }
            $this->info('  '.str_repeat('─', 50));
            $this->info("  Total: {$totalCleaned} rows ".($dryRun ? 'would be' : '').' purged');
            $this->info('');
        }

        return self::SUCCESS;
    }
}
