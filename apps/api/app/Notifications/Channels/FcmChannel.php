<?php

declare(strict_types=1);

namespace App\Notifications\Channels;

use App\Models\KKN\DeviceToken;
use App\Models\User;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * FCM (Firebase Cloud Messaging) notification channel.
 *
 * Dispatches a push payload to every registered device token for the
 * notifiable user. The payload is produced by the notification class's
 * `toFcm($notifiable): array` method (title, body, data, click_action).
 *
 * Behavior:
 *   - No-op when the user has disabled push via notification preferences.
 *   - No-op when FCM_SERVER_KEY is not configured (development or
 *     deployments without Firebase). Logs a single debug line per call.
 *   - Invalid tokens (FCM `NotRegistered` or `InvalidRegistration` result)
 *     are deleted from `device_tokens` so we stop trying them.
 *   - Network errors are logged but never rethrown — push failures must
 *     NOT break the fire-and-forget notification pipeline.
 *
 * Usage in a Notification class:
 *   public function via($notifiable): array
 *   {
 *       return ['database', \App\Notifications\Channels\FcmChannel::class];
 *   }
 *   public function toFcm($notifiable): array
 *   {
 *       return [
 *           'title' => 'Laporan disetujui',
 *           'body'  => 'Laporan harian tanggal X telah disetujui oleh DPL.',
 *           'data'  => ['kkn_report_id' => 42],
 *           'click_action' => '/mahasiswa/laporan-harian',
 *       ];
 *   }
 */
class FcmChannel
{
    private const FCM_LEGACY_ENDPOINT = 'https://fcm.googleapis.com/fcm/send';

    public function send(mixed $notifiable, Notification $notification): void
    {
        // Preference gate — single source of truth across channels.
        if ($notifiable instanceof User && ! $notifiable->wantsNotificationVia('push')) {
            return;
        }

        $serverKey = (string) config('services.fcm.server_key', '');
        if ($serverKey === '') {
            Log::debug('[FcmChannel] Skipping — FCM_SERVER_KEY not configured');

            return;
        }

        if (! method_exists($notification, 'toFcm')) {
            Log::warning('[FcmChannel] Notification class has no toFcm() method', [
                'notification' => $notification::class,
            ]);

            return;
        }

        $payload = $notification->toFcm($notifiable);
        if (! is_array($payload) || empty($payload['title'])) {
            Log::warning('[FcmChannel] toFcm() returned invalid payload', [
                'notification' => $notification::class,
            ]);

            return;
        }

        $tokens = DeviceToken::query()
            ->where('user_id', $notifiable->getKey())
            ->pluck('token')
            ->all();

        if (empty($tokens)) {
            return;
        }

        // FCM's multicast endpoint — up to 1000 tokens per request.
        // For SIBERMAS users this is always <10.
        try {
            $response = Http::withHeaders([
                'Authorization' => 'key='.$serverKey,
                'Content-Type' => 'application/json',
            ])->timeout(10)->post(self::FCM_LEGACY_ENDPOINT, [
                'registration_ids' => $tokens,
                'notification' => [
                    'title' => $payload['title'],
                    'body' => $payload['body'] ?? '',
                    'click_action' => $payload['click_action'] ?? null,
                ],
                'data' => $payload['data'] ?? [],
            ]);

            if (! $response->successful()) {
                Log::warning('[FcmChannel] FCM returned non-2xx', [
                    'status' => $response->status(),
                    'body' => substr($response->body(), 0, 500),
                ]);

                return;
            }

            // Clean up invalid tokens.
            $body = $response->json();
            if (! isset($body['results']) || ! is_array($body['results'])) {
                return;
            }
            foreach ($body['results'] as $i => $result) {
                $error = $result['error'] ?? null;
                if (in_array($error, ['NotRegistered', 'InvalidRegistration'], true)) {
                    DeviceToken::where('token', $tokens[$i] ?? null)->delete();
                }
            }
        } catch (\Throwable $e) {
            Log::warning('[FcmChannel] Dispatch failed', [
                'error' => $e->getMessage(),
                'notification' => $notification::class,
            ]);
        }
    }
}
