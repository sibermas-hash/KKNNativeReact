<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MasterWebhookController
{
    public function handle(Request $request): JsonResponse
    {
        $secret = (string) config('services.master_api.webhook_secret', '');
        if ($secret === '') {
            return response()->json([
                'ok' => false,
                'error' => 'MASTER_WEBHOOK_SECRET is not configured',
            ], 503);
        }

        $timestamp = (string) $request->header('X-Master-Timestamp', '');
        $signatureHeader = (string) $request->header('X-Master-Signature', '');

        if ($timestamp === '' || $signatureHeader === '') {
            return response()->json(['ok' => false, 'error' => 'Missing signature headers'], 401);
        }

        if (!ctype_digit($timestamp)) {
            return response()->json(['ok' => false, 'error' => 'Invalid timestamp'], 401);
        }

        $window = max(60, (int) config('services.master_api.webhook_window_seconds', 600));
        $ts = (int) $timestamp;
        if (abs(time() - $ts) > $window) {
            return response()->json(['ok' => false, 'error' => 'Timestamp outside allowed window'], 401);
        }

        $rawBody = (string) $request->getContent();
        $expected = hash_hmac('sha256', $timestamp . '.' . $rawBody, $secret);

        $sig = $signatureHeader;
        if (str_starts_with($sig, 'sha256=')) {
            $sig = substr($sig, 7);
        }

        if (!hash_equals($expected, (string) $sig)) {
            return response()->json(['ok' => false, 'error' => 'Invalid signature'], 401);
        }

        $payload = json_decode($rawBody, true);
        if (!is_array($payload)) {
            return response()->json(['ok' => false, 'error' => 'Invalid JSON'], 400);
        }

        $resources = [];
        if (isset($payload['resources']) && is_array($payload['resources'])) {
            $resources = array_values(array_filter($payload['resources'], fn ($v) => is_string($v) && $v !== ''));
        } elseif (isset($payload['resource']) && is_string($payload['resource']) && $payload['resource'] !== '') {
            $resources = [$payload['resource']];
        }
        $triggerDir = storage_path('app/master-webhook');
        if (!is_dir($triggerDir)) {
            @mkdir($triggerDir, 02775, true);
        }

        @chmod($triggerDir, 02775);

        $triggerPath = $triggerDir . DIRECTORY_SEPARATOR . 'trigger.json';
        $data = [
            'received_at' => now()->toIso8601String(),
            'timestamp' => $ts,
            'event_id' => $payload['id'] ?? null,
            'resources' => $resources,
        ];

        @file_put_contents($triggerPath, json_encode($data, JSON_UNESCAPED_SLASHES), LOCK_EX);

        Log::info('Master webhook received (KKN)', [
            'resources' => $resources,
        ]);

        // Sync will be executed by scheduler via master:webhook:sync command.
        return response()->json([
            'ok' => true,
            'queued' => true,
            'resources' => $resources,
        ], 202);
    }
}

