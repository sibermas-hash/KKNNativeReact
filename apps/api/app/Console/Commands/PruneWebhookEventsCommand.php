<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\WebhookEvent;
use Illuminate\Console\Command;

/**
 * R-004 (audit): prune completed webhook idempotency rows.
 *
 * Retention policy: successfully processed (state=done) events older than
 * `--days` are deleted. Failed events are kept longer so ops can investigate.
 * Default 7 days covers the longest reasonable SIAKAD retry window.
 *
 * Scheduled daily from bootstrap/app.php.
 */
class PruneWebhookEventsCommand extends Command
{
    protected $signature = 'webhooks:prune {--days=7 : Delete completed events older than this many days}';

    protected $description = 'Delete old successfully-processed webhook events';

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $cutoff = now()->subDays($days);

        $deleted = WebhookEvent::where('state', WebhookEvent::STATE_DONE)
            ->where('processed_at', '<', $cutoff)
            ->delete();

        $this->info("Pruned {$deleted} webhook_events rows older than {$days}d.");

        // Also alert if any failed rows have accumulated (no delete — ops need
        // to see them so they can investigate).
        $failedCount = WebhookEvent::where('state', WebhookEvent::STATE_FAILED)->count();
        if ($failedCount > 0) {
            $this->warn("NOTE: {$failedCount} failed webhook events still present. Investigate in webhook_events table.");
        }

        return self::SUCCESS;
    }
}
