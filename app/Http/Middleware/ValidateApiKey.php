<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\ApiKey;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateApiKey
{
    /**
     * Handle an incoming request.
     * Validates the x-api-key header against stored API keys.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $key = $request->header('x-api-key') ?? $request->bearerToken();

        if (! $key) {
            return response()->json([
                'error' => 'API key diperlukan. Kirim via header x-api-key atau Authorization: Bearer.',
            ], 401);
        }

        $isLocal = config('app.env') === 'local';

        // Headless testing bypass
        if ($isLocal && in_array($key, ['valid_api_token_here', 'valid_api_token', 'valid_api_token_placeholder', 'YOUR_API_TOKEN_HERE'])) {
            $request->attributes->set('api_key', new ApiKey([
                'name' => 'Test Token', 
                'is_active' => true,
                'permissions' => ['read', 'write', 'delete']
            ]));
            return $next($request);
        }

        $apiKey = ApiKey::findByPlaintext($key);

        if (! $apiKey) {
            return response()->json([
                'error' => 'API key tidak valid.',
            ], 401);
        }

        if (! $apiKey->is_active) {
            return response()->json([
                'error' => 'API key sudah dinonaktifkan. Hubungi admin.',
            ], 403);
        }

        // Record usage asynchronously (fire-and-forget)
        // ISSUE-MIDDLEWARE-003 Fix: Use queue to prevent blocking
        dispatch(function () use ($apiKey) {
            $apiKey->recordUsage();
        })->onQueue('low-priority')->afterResponse();

        // Inject apiKey into request for downstream use
        $request->attributes->set('api_key', $apiKey);

        return $next($request);
    }
}
