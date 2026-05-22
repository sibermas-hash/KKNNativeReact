<?php

declare(strict_types=1);

namespace App\Notifications\Channels;

use App\Models\KKN\DeviceToken;
use App\Models\User;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FcmNotification;
use Kreait\Firebase\Exception\Messaging\NotFound;
use Kreait\Firebase\Exception\Messaging\InvalidMessage;

/**
 * FCM (Firebase Cloud Messaging) notification channel — v2 (HTTP v1 API).
 *
 * Uses kreait/laravel-firebase Admin SDK for modern FCM HTTP v1 API.
 * Falls back to legacy endpoint if Firebase credentials not configured.
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
 *           'data'  => ['kkn_report_id' => '42'],
 *           'click_action' => '/mahasiswa/laporan-harian',
 *       ];
 *   }
 */
class FcmChannel
{
    public function __construct(
        private readonly ?Messaging $messaging = null,
    ) {}

    public function send(mixed $notifiable, Notification $notification): void
    {
        // Preference gate
        if ($notifiable instanceof User && !$notifiable->wantsNotificationVia('push')) {
            return;
        }

        if (!method_exists($notification, 'toFcm')) {
            Log::warning('[FcmChannel] Notification class has no toFcm() method', [
                'notification' => $notification::class,
            ]);
            return;
        }

        $payload = $notification->toFcm($notifiable);
        if (!is_array($payload) || empty($payload['title'])) {
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

        // Use Firebase Admin SDK if available
        if ($this->messaging) {
            $this->sendViaAdminSdk($tokens, $payload, $notification);
        } else {
            // Fallback to legacy API
            $this->sendViaLegacy($tokens, $payload, $notifiable, $notification);
        }
    }

    /**
     * Send via Firebase Admin SDK (HTTP v1 API) — recommended.
     */
    private function sendViaAdminSdk(array $tokens, array $payload, Notification $notification): void
    {
        try {
            $fcmNotification = FcmNotification::create(
                $payload['title'],
                $payload['body'] ?? '',
            );

            $data = array_map('strval', $payload['data'] ?? []);
            if (!empty($payload['click_action'])) {
                $data['click_action'] = $payload['click_action'];
            }

            $message = CloudMessage::new()
                ->withNotification($fcmNotification)
                ->withData($data);

            // Android config — high priority for immediate delivery
            $message = $message->withAndroidConfig([
                'priority' => 'high',
                'notification' => [
                    'channel_id' => 'sibermas_default',
                    'click_action' => $payload['click_action'] ?? 'FLUTTER_NOTIFICATION_CLICK',
                ],
            ]);

            // APNs config for iOS
            $message = $message->withApnsConfig([
                'payload' => [
                    'aps' => [
                        'alert' => [
                            'title' => $payload['title'],
                            'body' => $payload['body'] ?? '',
                        ],
                        'sound' => 'default',
                        'badge' => 1,
                    ],
                ],
            ]);

            // Web push config
            if (!empty($payload['click_action'])) {
                $message = $message->withWebPushConfig([
                    'fcm_options' => [
                        'link' => $payload['click_action'],
                    ],
                ]);
            }

            $report = $this->messaging->sendMulticast($message, $tokens);

            // Clean up invalid tokens
            if ($report->hasFailures()) {
                foreach ($report->failures()->getItems() as $failure) {
                    $error = $failure->error();
                    if ($error instanceof NotFound || $error instanceof InvalidMessage) {
                        $token = $failure->target()->value();
                        DeviceToken::where('token', $token)->delete();
                        Log::debug('[FcmChannel] Removed invalid token', ['token' => substr($token, 0, 20) . '...']);
                    }
                }
            }

            $successCount = $report->successes()->count();
            if ($successCount > 0) {
                Log::debug('[FcmChannel] Sent via Admin SDK', [
                    'success' => $successCount,
                    'failures' => $report->failures()->count(),
                    'notification' => $notification::class,
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('[FcmChannel] Admin SDK dispatch failed', [
                'error' => $e->getMessage(),
                'notification' => $notification::class,
            ]);
        }
    }

    /**
     * Fallback: Legacy FCM API (deprecated but still works).
     */
    private function sendViaLegacy(array $tokens, array $payload, mixed $notifiable, Notification $notification): void
    {
        $serverKey = (string) config('services.fcm.server_key', '');
        if ($serverKey === '') {
            Log::debug('[FcmChannel] Skipping — neither Firebase credentials nor FCM_SERVER_KEY configured');
            return;
        }

        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => 'key=' . $serverKey,
                'Content-Type' => 'application/json',
            ])->timeout(10)->post('https://fcm.googleapis.com/fcm/send', [
                'registration_ids' => $tokens,
                'notification' => [
                    'title' => $payload['title'],
                    'body' => $payload['body'] ?? '',
                    'click_action' => $payload['click_action'] ?? null,
                ],
                'data' => $payload['data'] ?? [],
            ]);

            if (!$response->successful()) {
                Log::warning('[FcmChannel] Legacy FCM returned non-2xx', [
                    'status' => $response->status(),
                ]);
                return;
            }

            // Clean up invalid tokens
            $body = $response->json();
            if (isset($body['results']) && is_array($body['results'])) {
                foreach ($body['results'] as $i => $result) {
                    $error = $result['error'] ?? null;
                    if (in_array($error, ['NotRegistered', 'InvalidRegistration'], true)) {
                        DeviceToken::where('token', $tokens[$i] ?? null)->delete();
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('[FcmChannel] Legacy dispatch failed', [
                'error' => $e->getMessage(),
                'notification' => $notification::class,
            ]);
        }
    }
}
