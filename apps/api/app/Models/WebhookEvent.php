<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Audit R-004: idempotency record for inbound webhooks.
 *
 * The WebhookController uses this to prevent duplicate processing AND to
 * correctly distinguish "retry arrived while original is still processing"
 * from "retry arrived after original completed" — the prior Cache::add
 * approach conflated the two and could silently swallow events.
 */
class WebhookEvent extends Model
{
    public const STATE_PROCESSING = 'processing';

    public const STATE_DONE = 'done';

    public const STATE_FAILED = 'failed';

    protected $fillable = [
        'webhook_id',
        'event',
        'state',
        'retry_count',
        'error_message',
        'processed_at',
    ];

    protected $casts = [
        'retry_count' => 'integer',
        'processed_at' => 'datetime',
    ];

    /**
     * Consider a row stuck in 'processing' as crashed after this many seconds.
     * Set to a comfortable upper bound on webhook processing wall-clock time.
     */
    public const PROCESSING_STALE_AFTER_SECONDS = 300; // 5 minutes

    public function isStale(): bool
    {
        if ($this->state !== self::STATE_PROCESSING) {
            return false;
        }

        return $this->updated_at
            && $this->updated_at->lt(now()->subSeconds(self::PROCESSING_STALE_AFTER_SECONDS));
    }
}
