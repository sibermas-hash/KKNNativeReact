<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CspHeaders
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Security headers
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
        $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        $response->headers->set('Pragma', 'no-cache');

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
                "img-src 'self' https://*.tile.openstreetmap.org data: blob:",
                "connect-src 'self' https://{$appHost} wss://{$appHost}",
                "object-src 'none'",
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "upgrade-insecure-requests",
            ]);

            $response->headers->set('Content-Security-Policy', $csp);
        }

        return $response;
    }
}
