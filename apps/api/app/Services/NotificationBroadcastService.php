<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Notifications\GenericNotification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Log;

/**
 * NotificationBroadcastService — central logic untuk broadcast notifications.
 *
 * Digunakan oleh:
 *   - NotificationBroadcastController (sync path untuk user_ids/kecil)
 *   - BroadcastNotificationJob (async path untuk broadcast besar)
 *
 * Output konsisten: {'sent' => int, 'failed' => int, 'matched' => int}
 * supaya HTTP response + log format sama.
 */
class NotificationBroadcastService
{
    /**
     * Kirim notifikasi ke semua user yang cocok target.
     *
     * @param  array<int, int>  $userIds
     * @return array{sent: int, failed: int, matched: int}
     */
    public function broadcast(
        string $title,
        string $message,
        string $priority,
        ?string $action,
        ?string $type,
        string $target,
        array $userIds = [],
    ): array {
        $query = $this->buildRecipientQuery($target, $userIds);
        if ($query === null) {
            return ['sent' => 0, 'failed' => 0, 'matched' => 0];
        }

        $matched = (clone $query)->count();
        if ($matched === 0) {
            return ['sent' => 0, 'failed' => 0, 'matched' => 0];
        }

        $notification = new GenericNotification(
            title: $title,
            message: $message,
            priority: $priority,
            action: $action,
            type: $type ?? 'announcement',
        );

        $sent = 0;
        $failed = 0;

        $query->chunkById(500, function ($users) use ($notification, &$sent, &$failed) {
            foreach ($users as $user) {
                try {
                    $user->notify($notification);
                    $sent++;
                } catch (\Throwable $e) {
                    $failed++;
                    Log::warning('NotificationBroadcastService: delivery failed', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        });

        return [
            'sent' => $sent,
            'failed' => $failed,
            'matched' => $matched,
        ];
    }

    /**
     * Count recipients matched by target (without sending).
     */
    public function countRecipients(string $target, array $userIds = []): int
    {
        $query = $this->buildRecipientQuery($target, $userIds);

        return $query === null ? 0 : $query->count();
    }

    /**
     * Resolve target string → User query. Returns null for invalid target.
     *
     * @param  array<int, int>  $userIds
     */
    public function buildRecipientQuery(string $target, array $userIds = []): ?Builder
    {
        $base = User::query()->where('is_active', true);

        if ($target === 'all') {
            return $base;
        }

        if ($target === 'user_ids') {
            if (empty($userIds)) {
                return null;
            }

            return $base->whereIn('id', $userIds);
        }

        if (str_starts_with($target, 'role:')) {
            $role = trim(substr($target, 5));
            if ($role === '') {
                return null;
            }

            return $base->whereHas('roles', fn ($q) => $q->where('name', $role));
        }

        if (str_starts_with($target, 'fakultas:')) {
            $fakultasId = (int) substr($target, 9);
            if ($fakultasId <= 0) {
                return null;
            }

            return $base->where(function (Builder $q) use ($fakultasId) {
                $q->whereHas('mahasiswa', fn ($m) => $m->where('fakultas_id', $fakultasId))
                    ->orWhereHas('dosen', fn ($d) => $d->where('fakultas_id', $fakultasId))
                    ->orWhere('fakultas_id', $fakultasId);
            });
        }

        return null;
    }
}
