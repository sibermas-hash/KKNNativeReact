<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Jobs\BroadcastNotificationJob;
use App\Services\NotificationBroadcastService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Superadmin-triggered broadcast for notifications.
 *
 * POST /api/v1/admin/notifications/broadcast
 *
 * Body:
 *   title      (string, required, max 150)
 *   message    (string, required, max 500)
 *   priority   (info|success|warning|danger, default info)
 *   action     (string, optional — internal URL like /mahasiswa/laporan-harian)
 *   type       (string, optional — categorization tag)
 *   target     (all | role:student|dosen|dpl|admin|faculty_admin | fakultas:{id} | user_ids)
 *   user_ids   (int[], required when target=user_ids)
 *
 * Behavior:
 *   - Validates target & counts recipients pre-flight.
 *   - Small broadcasts (target=user_ids, ≤50 recipients) dikirim SYNCHRONOUSLY
 *     → response body punya total_sent akurat.
 *   - Broadcast besar (all, role:*, fakultas:*, atau user_ids > 50)
 *     di-dispatch ke queue → response hanya total_matched + status=queued.
 */
class NotificationBroadcastController extends Controller
{
    use ApiResponse;

    private const SYNC_LIMIT = 50;

    public function __construct(private readonly NotificationBroadcastService $service) {}

    public function broadcast(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'message' => ['required', 'string', 'max:500'],
            'priority' => ['nullable', 'in:info,success,warning,danger'],
            'action' => ['nullable', 'string', 'max:500'],
            'type' => ['nullable', 'string', 'max:50'],
            'target' => ['required', 'string', 'max:100'],
            'user_ids' => ['sometimes', 'array'],
            'user_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $target = $validated['target'];
        $userIds = $validated['user_ids'] ?? [];

        // Pre-flight: validate target syntax
        $query = $this->service->buildRecipientQuery($target, $userIds);
        if ($query === null) {
            return $this->badRequest(
                "Target tidak valid. Gunakan salah satu: 'all', 'role:<role>', 'fakultas:<id>', 'user_ids'."
            );
        }

        $total = (clone $query)->count();
        if ($total === 0) {
            return $this->badRequest('Tidak ada penerima yang cocok dengan target tersebut.');
        }

        // Small broadcast → sync (response bisa report total_sent)
        $useSyncPath = $target === 'user_ids' && $total <= self::SYNC_LIMIT;

        if ($useSyncPath) {
            $result = $this->service->broadcast(
                title: $validated['title'],
                message: $validated['message'],
                priority: $validated['priority'] ?? 'info',
                action: $validated['action'] ?? null,
                type: $validated['type'] ?? 'announcement',
                target: $target,
                userIds: $userIds,
            );

            Log::info('Broadcast notification (sync path)', [
                'admin_user_id' => $request->user()?->id,
                'target' => $target,
                'total_matched' => $result['matched'],
                'total_sent' => $result['sent'],
                'total_failed' => $result['failed'],
            ]);

            return $this->success([
                'target' => $target,
                'total_matched' => $result['matched'],
                'total_sent' => $result['sent'],
                'total_failed' => $result['failed'],
                'status' => 'sent',
            ], "Pengumuman terkirim ke {$result['sent']} penerima.");
        }

        // Large broadcast → async queue
        BroadcastNotificationJob::dispatch(
            title: $validated['title'],
            message: $validated['message'],
            priority: $validated['priority'] ?? 'info',
            action: $validated['action'] ?? null,
            type: $validated['type'] ?? 'announcement',
            target: $target,
            userIds: $userIds,
            adminUserId: $request->user()->id,
        );

        Log::info('Broadcast notification queued (async path)', [
            'admin_user_id' => $request->user()?->id,
            'target' => $target,
            'total_matched' => $total,
        ]);

        return $this->success([
            'target' => $target,
            'total_matched' => $total,
            'status' => 'queued',
        ], "Pengumuman sedang dikirim ke {$total} penerima secara background.");
    }
}
