<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CspHeaders
{
    /**
     * Handle an incoming request.
     *
     * Security headers + Cache-Control policy:
     *
     *   - `no-store` is applied ONLY to authenticated / sensitive responses
     *     (route has `auth:sanctum` OR user is authenticated OR method is
     *     non-GET). Public anonymous GET responses (home feed, public
     *     announcements, verify-certificate) are left cacheable so CDN /
     *     browser cache / Next.js `revalidate` hints actually take effect.
     *
     *   - If a controller has already set Cache-Control explicitly, we do
     *     NOT override it — controllers know their own freshness contract.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Cache-Control: conditional, only for sensitive responses
        $this->applyCacheControl($request, $response);

        return $response;
    }

    /**
     * Decide whether the response must be `no-store`, and apply accordingly.
     *
     * Policy:
     *   - If controller already set Cache-Control → respect it, do nothing.
     *   - If request is authenticated OR non-GET → `no-store` (safe default).
     *   - Otherwise (anonymous GET on public endpoint) → leave untouched.
     *     Public endpoints typically want `public, max-age=...` or rely on
     *     upstream (nginx / Next.js) caching behavior.
     */
    private function applyCacheControl(Request $request, Response $response): void
    {
        // Respect explicit controller choice.
        if ($response->headers->has('Cache-Control')) {
            $existing = (string) $response->headers->get('Cache-Control');
            // Only override if Laravel's default placeholder leaked through.
            if ($existing !== '' && $existing !== 'no-cache, private') {
                return;
            }
        }

        $isAuthenticated = $request->user() !== null;
        $isMutation = ! in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true);

        if ($isAuthenticated || $isMutation) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            $response->headers->set('Pragma', 'no-cache');
        }
    }
}
