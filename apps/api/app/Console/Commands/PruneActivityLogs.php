<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\KKN\UserActivityLog;
use Illuminate\Console\Command;

/**
 * PruneActivityLogs — hapus user_activity_logs lama (default > 180 hari).
 *
 * Diharapkan dijadwalkan via routes/console.php:
 *   Schedule::command('activity-logs:prune')->daily();
 */
class PruneActivityLogs extends Command
{
    protected $signature = 'activity-logs:prune {--days=180 : Retain logs newer than this many days}';

    protected $description = 'Hapus user activity logs lebih lama dari N hari (default 180)';

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $cutoff = now()->subDays($days);

        $this->info("Menghapus activity logs lebih lama dari {$cutoff->toDateString()}...");

        $deleted = UserActivityLog::where('created_at', '<', $cutoff)->delete();

        $this->info("Terhapus: {$deleted} rows");

        return self::SUCCESS;
    }
}
