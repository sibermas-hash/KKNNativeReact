<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Services\NotificationBroadcastService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * Dispatches broadcast notifications asynchronously via the queue.
 *
 * Fan-out besar (role:*, fakultas:*, all) yang bisa 5000+ user
 * dijalankan via queue worker. Controller untuk target `user_ids`
 * memakai service langsung (synchronous) supaya response tahu total_sent.
 */
class BroadcastNotificationJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public array $backoff = [10, 60, 300];

    public int $timeout = 600;

    public function __construct(
        public readonly string $title,
        public readonly string $message,
        public readonly string $priority,
        public readonly ?string $action,
        public readonly ?string $type,
        public readonly string $target,
        public readonly array $userIds,
        public readonly int $adminUserId,
    ) {}

    public function handle(NotificationBroadcastService $service): void
    {
        $result = $service->broadcast(
            title: $this->title,
            message: $this->message,
            priority: $this->priority,
            action: $this->action,
            type: $this->type,
            target: $this->target,
            userIds: $this->userIds,
        );

        Log::info('BroadcastNotificationJob completed', [
            'admin_user_id' => $this->adminUserId,
            'target' => $this->target,
            'total_matched' => $result['matched'],
            'total_sent' => $result['sent'],
            'total_failed' => $result['failed'],
        ]);
    }
}
