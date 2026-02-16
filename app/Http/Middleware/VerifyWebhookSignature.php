<?php

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
        if (!$signature) {
            return response()->json(['error' => 'Signature missing'], 401);
        }

        // Get key from config
        $secret = config('services.master_api.webhook_secret');
        if (!$secret) {
            // Log error: Secret not configured
            return response()->json(['error' => 'Server configuration error'], 500);
        }
        
        // Re-calculate signature from body
        $expected = 'sha256=' . hash_hmac('sha256', $request->getContent(), $secret);

        if (!hash_equals($expected, $signature)) {
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        return $next($request);
    }
}
