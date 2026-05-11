<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class VerifyWebhookSignature
{
    public function handle(Request $request, Closure $next): Response
    {
        $signature = $request->header('X-Hub-Signature');

        if (! $signature) {
            return response()->json(['error' => 'Signature missing'], 401);
        }

        $secret = config('services.master_api.webhook_secret');
        
        if (! $secret) {
            Log::critical('Webhook secret not configured. Set MASTER_WEBHOOK_SECRET in .env');
            return response()->json(['error' => 'Server configuration error'], 500);
        }

        // H-009 fix: Timestamp is REQUIRED — without it, a captured signature
        // could be replayed indefinitely (HMAC is deterministic over body only).
        $timestamp = $request->header('X-Webhook-Timestamp');
        if (! $timestamp) {
            return response()->json(['error' => 'X-Webhook-Timestamp header required'], 401);
        }

        if (! is_numeric($timestamp)) {
            return response()->json(['error' => 'Invalid timestamp format'], 401);
        }

        $windowSeconds = (int) config('services.master_api.webhook_window_seconds', 600);
        if (abs(time() - (int) $timestamp) > $windowSeconds) {
            return response()->json(['error' => 'Request expired'], 401);
        }

        $payload = $timestamp . '.' . $request->getContent();
        
        $expected = 'sha256=' . hash_hmac('sha256', $payload, $secret);

        if (! hash_equals($expected, $signature)) {
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        return $next($request);
    }
}
