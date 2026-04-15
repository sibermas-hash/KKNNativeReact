<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyWebhookSignature
{
    public function handle(Request $request, Closure $next): Response
    {
        $signature = $request->header('X-Hub-Signature');

        // Ensure signature is present
        if (! $signature) {
            return response()->json(['error' => 'Signature missing'], 401);
        }

        // Get key from config
        $secret = config('services.master_api.webhook_secret');
        if (! $secret) {
            return response()->json(['error' => 'Server configuration error'], 500);
        }

        // Validate timestamp to prevent replay attacks
        $timestamp = $request->header('X-Webhook-Timestamp');
        if ($timestamp) {
            // Validate that timestamp is numeric before casting
            if (! is_numeric($timestamp)) {
                return response()->json(['error' => 'Invalid timestamp format'], 401);
            }

            $windowSeconds = (int) config('services.master_api.webhook_window_seconds', 600);
            if (abs(time() - (int) $timestamp) > $windowSeconds) {
                return response()->json(['error' => 'Request expired'], 401);
            }
        }

        // Re-calculate signature from body (include timestamp if present)
        $payload = $timestamp
            ? $timestamp.'.'.$request->getContent()
            : $request->getContent();
        $expected = 'sha256='.hash_hmac('sha256', $payload, $secret);

        if (! hash_equals($expected, $signature)) {
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        return $next($request);
    }
}
