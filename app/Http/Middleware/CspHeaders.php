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
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

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
                "style-src 'self' https://fonts.googleapis.com 'nonce-{$nonce}'",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' https://*.tile.openstreetmap.org",
                "connect-src 'self' https://{$appHost} wss://{$appHost}",
                "object-src 'none'",
                "frame-ancestors 'self'",
                "base-uri 'self'",
                "form-action 'self'",
            ]);

            $response->headers->set('Content-Security-Policy', $csp);
        }

        return $response;
    }
}
