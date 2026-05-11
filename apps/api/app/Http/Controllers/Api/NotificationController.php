<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\DeviceToken;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    use ApiResponse;

    /**
     * GET /notifications
     *
     * Paginated list for the full-page history view. Supports filters:
     *   status   : 'all' (default) | 'read' | 'unread'
     *   priority : info | success | warning | danger
     *   type     : notification->data['type'] match (LIKE)
     *   date_from / date_to : ISO date bounds
     *   per_page : 10..50 (default 20)
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'in:all,read,unread'],
            'priority' => ['nullable', 'in:info,success,warning,danger'],
            'type' => ['nullable', 'string', 'max:50'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:50'],
        ]);

        $perPage = (int) ($validated['per_page'] ?? 20);
        $status = $validated['status'] ?? 'all';

        $query = $request->user()->notifications()->latest();

        if ($status === 'unread') {
            $query->whereNull('read_at');
        } elseif ($status === 'read') {
            $query->whereNotNull('read_at');
        }

        // The `data` column is TEXT containing a JSON string in Laravel's
        // default notifications table, so use simple LIKE patterns rather
        // than JSON operators (which require JSONB casts on Postgres).
        $driver = $query->getQuery()->getConnection()->getDriverName();
        $ciOp = $driver === 'pgsql' ? 'ILIKE' : 'LIKE';

        if (! empty($validated['priority'])) {
            // Exact match on the quoted string value in the serialized JSON.
            $query->where('data', 'LIKE', '%"priority":"'.$validated['priority'].'"%');
        }
        if (! empty($validated['type'])) {
            $needle = '%"type":"'.str_replace('%', '\\%', $validated['type']).'%';
            // Partial match on type — case-insensitive where supported.
            $query->where('data', $ciOp, $needle);
        }
        if (! empty($validated['date_from'])) {
            $query->where('created_at', '>=', $validated['date_from']);
        }
        if (! empty($validated['date_to'])) {
            $query->where('created_at', '<=', Carbon::parse($validated['date_to'])->endOfDay());
        }

        $paginator = $query->paginate($perPage);

        $notifications = $paginator->getCollection()->map(fn ($n) => [
            'id' => $n->id,
            'type' => $n->data['type'] ?? 'info',
            'title' => $n->data['title'] ?? 'Notification',
            'message' => $n->data['message'] ?? '',
            'action' => $n->data['action'] ?? null,
            'icon' => $n->data['icon'] ?? 'bell',
            'priority' => $n->data['priority'] ?? 'info',
            'read_at' => $n->read_at?->toIso8601String(),
            'is_read' => $n->read_at !== null,
            'created_at_human' => $n->created_at->diffForHumans(),
            'created_at' => $n->created_at->toIso8601String(),
        ]);

        return $this->success([
            'notifications' => $notifications,
            'unread_count' => $request->user()->unreadNotifications()->count(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * GET /notifications/unread
     *
     * Fast-polling endpoint for the global bell. Returns at most 15 unread
     * notifications + total unread count. Intentionally does NOT use
     * pagination to keep the response cheap.
     */
    public function unread(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->unreadNotifications()
            ->latest()
            ->take(15)
            ->get()
            ->map(fn ($n) => [
                'id' => $n->id,
                'type' => $n->data['type'] ?? 'info',
                'title' => $n->data['title'] ?? 'Notification',
                'message' => $n->data['message'] ?? '',
                'action' => $n->data['action'] ?? null,
                'icon' => $n->data['icon'] ?? 'bell',
                'priority' => $n->data['priority'] ?? 'info',
                'created_at' => $n->created_at->diffForHumans(),
            ]);

        return $this->success([
            'notifications' => $notifications,
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /**
     * POST /notifications/{id}/read
     *
     * Mark a single notification as read. 404 if the id doesn't belong to
     * the authenticated user (cross-user protection via relation scope).
     */
    public function markRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return $this->success(null, 'Notifikasi ditandai sudah dibaca.');
    }

    /**
     * POST /notifications/read-all
     *
     * Bulk-mark all UNREAD notifications as read for the authenticated user.
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return $this->success(null, 'Semua notifikasi ditandai sudah dibaca.');
    }

    /**
     * POST /device-tokens
     *
     * Register (or refresh last_used_at on) an FCM/APNs device token for
     * push notification delivery. Deduped by token value — re-submission
     * is idempotent.
     */
    public function storeDeviceToken(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
            'device_type' => 'nullable|string|max:20',
            'platform' => 'nullable|string|max:20',
        ]);

        $platform = $request->input('device_type') ?: $request->input('platform');

        DeviceToken::query()->updateOrCreate(
            ['token' => $request->token],
            [
                'user_id' => $request->user()->id,
                'platform' => $platform,
                'last_used_at' => now(),
            ]
        );

        return $this->success(null, 'Device token updated successfully');
    }
}
