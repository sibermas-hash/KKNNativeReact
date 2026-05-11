<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Server-Sent Events stream for real-time notifications.
 *
 * Opens a long-lived HTTP response that keeps pushing SSE frames until:
 *   - 60 seconds elapse (configurable via STREAM_TTL_SECONDS)
 *   - the client disconnects (detected via connection_aborted())
 *
 * Clients should use `EventSource` with the browser's automatic reconnect
 * — when this endpoint closes after 60s, the browser opens a new connection.
 *
 * Design notes:
 *   - DB polling is per-user every 3s. Acceptable for SIBERMAS scale
 *     (estimated <500 concurrent authenticated users). For larger scale,
 *     swap the inner loop for Redis pub/sub triggered by a
 *     notification-created event.
 *   - `X-Accel-Buffering: no` tells nginx to not buffer the response body.
 *   - We commit the current DB transaction early (none should be open here,
 *     but the Sanctum middleware sometimes leaves a connection warm).
 *   - `set_time_limit(0)` because PHP-FPM's default max_execution_time would
 *     kill the connection at 30s. We cap ourselves at STREAM_TTL_SECONDS.
 */
class NotificationStreamController extends Controller
{
    private const STREAM_TTL_SECONDS = 60;

    private const POLL_INTERVAL_SECONDS = 3;

    private const HEARTBEAT_EVERY_POLLS = 4; // = 12 seconds

    public function stream(Request $request): StreamedResponse
    {
        $user = $request->user();
        abort_if($user === null, 401);

        // Snapshot the highest-seen notification created_at so we only emit
        // deltas from this point forward. Avoids flooding the client with
        // notifications they already have in their list on initial connect.
        $lastSeen = now();

        return response()->stream(function () use ($user, &$lastSeen) {
            @set_time_limit(0);
            @ignore_user_abort(false);

            $deadline = now()->addSeconds(self::STREAM_TTL_SECONDS);
            $pollCount = 0;

            // Initial 'connected' event so clients know the handshake worked.
            $this->sendEvent('connected', [
                'at' => now()->toIso8601String(),
                'ttl_seconds' => self::STREAM_TTL_SECONDS,
            ]);

            while (now()->lt($deadline)) {
                if (connection_aborted()) {
                    break;
                }

                // Fetch unread notifications created AFTER our last sweep.
                // Using `$user->notifications()` (not `unreadNotifications()`)
                // is intentional — a notification might have already been
                // marked read by a parallel tab during the polling window.
                $fresh = $user->notifications()
                    ->where('created_at', '>', $lastSeen)
                    ->orderBy('created_at')
                    ->get();

                foreach ($fresh as $n) {
                    $this->sendEvent('notification', [
                        'id' => $n->id,
                        'type' => $n->data['type'] ?? 'info',
                        'title' => $n->data['title'] ?? 'Notification',
                        'message' => $n->data['message'] ?? '',
                        'action' => $n->data['action'] ?? null,
                        'priority' => $n->data['priority'] ?? 'info',
                        'is_read' => $n->read_at !== null,
                        'created_at' => $n->created_at->toIso8601String(),
                    ]);
                    $lastSeen = $n->created_at;
                }

                // Heartbeat every N polls to keep proxies happy.
                $pollCount++;
                if ($pollCount % self::HEARTBEAT_EVERY_POLLS === 0) {
                    echo ": heartbeat\n\n";
                    $this->flushBuffers();
                }

                sleep(self::POLL_INTERVAL_SECONDS);
            }

            $this->sendEvent('close', ['reason' => 'ttl']);
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no', // nginx
        ]);
    }

    /**
     * Send a single SSE frame. One event = one `event:` + one `data:` line,
     * followed by the two-newline frame terminator.
     */
    private function sendEvent(string $event, array $data): void
    {
        echo "event: {$event}\n";
        echo 'data: '.json_encode($data, JSON_UNESCAPED_UNICODE)."\n\n";
        $this->flushBuffers();
    }

    private function flushBuffers(): void
    {
        if (ob_get_level() > 0) {
            @ob_flush();
        }
        @flush();
    }
}
