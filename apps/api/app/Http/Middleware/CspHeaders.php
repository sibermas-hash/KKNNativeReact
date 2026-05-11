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

        // Security headers (always applied)
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

        // Cache-Control: conditional, only for sensitive responses
        $this->applyCacheControl($request, $response);

        // HSTS — enforce HTTPS in production
        if (config('app.env') === 'production') {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        // Only apply CSP in non-local environments to avoid Vite dev server friction
        if (config('app.env') !== 'local') {
            $nonce = base64_encode(random_bytes(16));
            $appHost = parse_url(config('app.url'), PHP_URL_HOST) ?: 'localhost';

            $csp = implode('; ', [
                "default-src 'self'",
                "script-src 'self' 'nonce-{$nonce}'",
                "style-src 'self' https://fonts.googleapis.com 'unsafe-inline' 'nonce-{$nonce}'",
                "font-src 'self' https://fonts.gstatic.com data:",
                // MapLibre tile providers: OSM (legacy), CARTO Voyager/Dark Matter basemaps, Esri World Imagery.
                // Keep list explicit so rogue tile origins aren't accidentally allowed.
                "img-src 'self' https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://server.arcgisonline.com data: blob:",
                "connect-src 'self' https://{$appHost} wss://{$appHost}",
                "object-src 'none'",
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                'upgrade-insecure-requests',
            ]);

            $response->headers->set('Content-Security-Policy', $csp);
        }

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
