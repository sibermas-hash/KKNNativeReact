<?php

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
        $key = $request->header('x-api-key');

        if (!$key) {
            return response()->json([
                'error' => 'API key diperlukan. Kirim via header x-api-key.',
            ], 401);
        }

        $apiKey = ApiKey::where('key', $key)->first();

        if (!$apiKey) {
            return response()->json([
                'error' => 'API key tidak valid.',
            ], 401);
        }

        if (!$apiKey->is_active) {
            return response()->json([
                'error' => 'API key sudah dinonaktifkan. Hubungi admin.',
            ], 403);
        }

        // Record usage (fire-and-forget, don't block the request)
        $apiKey->recordUsage();

        // Inject apiKey into request for downstream use
        $request->attributes->set('api_key', $apiKey);

        return $next($request);
    }
}