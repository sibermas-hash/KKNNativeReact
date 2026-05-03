<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use const DIRECTORY_SEPARATOR;

use App\Jobs\SyncMasterDataJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * @deprecated This controller is not used in routes.
 *             Use WebhookController instead which is registered at /api/webhooks/master-data.
 *             This file is kept for reference only and may be removed in future cleanup.
 */
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

        if (! ctype_digit($timestamp)) {
            return response()->json(['ok' => false, 'error' => 'Invalid timestamp'], 401);
        }

        $window = max(60, (int) config('services.master_api.webhook_window_seconds', 600));
        $ts = (int) $timestamp;
        if (abs(time() - $ts) > $window) {
            return response()->json(['ok' => false, 'error' => 'Timestamp outside allowed window'], 401);
        }

        $rawBody = (string) $request->getContent();
        $expected = hash_hmac('sha256', $timestamp.'.'.$rawBody, $secret);

        $sig = $signatureHeader;
        if (str_starts_with($sig, 'sha256=')) {
            $sig = substr($sig, 7);
        }

        if (! hash_equals($expected, (string) $sig)) {
            return response()->json(['ok' => false, 'error' => 'Invalid signature'], 401);
        }

        $payload = json_decode($rawBody, true);
        if (! \is_array($payload)) {
            return response()->json(['ok' => false, 'error' => 'Invalid JSON'], 400);
        }

        $resources = [];
        if (isset($payload['resources']) && \is_array($payload['resources'])) {
            $resources = array_values(array_filter($payload['resources'], static fn ($v): bool => \is_string($v) && $v !== ''));
        } elseif (isset($payload['resource']) && \is_string($payload['resource']) && $payload['resource'] !== '') {
            $resources = [$payload['resource']];
        }

        // Resolve sync type from webhook resources
        $syncType = $this->resolveSyncType($resources);

        // Dispatch queue job instead of writing trigger file
        SyncMasterDataJob::dispatch($syncType, $resources);

        Log::info('Master webhook received (KKN) — dispatched sync job', [
            'resources' => $resources,
            'sync_type' => $syncType,
        ]);

        return response()->json([
            'ok' => true,
            'queued' => true,
            'resources' => $resources,
        ], 202);
    }

    private function ensureLogWritable(): void
    {
        $dir = storage_path('logs');
        $today = now()->format('Y-m-d');

        $daily = $dir.DIRECTORY_SEPARATOR."laravel-{$today}.log";
        if (is_file($daily)) {
            if (! chmod($daily, 0664)) {
                Log::warning('Failed to change log file permissions', ['file' => $daily]);
            }
        }

        $single = $dir.DIRECTORY_SEPARATOR.'laravel.log';
        if (is_file($single)) {
            if (! chmod($single, 0664)) {
                Log::warning('Failed to change log file permissions', ['file' => $single]);
            }
        }
    }

    private function resolveSyncType(array $resources): string
    {
        $map = [
            'organizations' => 'fakultas',
            'employees' => 'dosen',
            'dosen' => 'dosen',
            'students' => 'mahasiswa',
            'mahasiswa' => 'mahasiswa',
        ];

        $types = [];
        foreach ($resources as $r) {
            if (isset($map[$r])) {
                $types[] = $map[$r];
            }
        }

        $types = array_unique($types);
        if (\count($types) === 1) {
            return $types[0];
        }

        return 'all';
    }
}
