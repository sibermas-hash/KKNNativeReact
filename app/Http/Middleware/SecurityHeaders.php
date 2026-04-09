<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Http\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, \Closure $next)
    {
        $response = $next($request);

        // Prevent browser from MIME-sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff', true);

        // Prevent clickjacking attacks
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN', true);

        // Enable XSS protection in older browsers
        $response->headers->set('X-XSS-Protection', '1; mode=block', true);

        // Referrer policy
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin', true);

        // Feature policy (modern alternative: Permissions-Policy)
        $response->headers->set(
            'Permissions-Policy',
            'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
        );

        // HTTPS only (HSTS)
        if (app()->environment('production')) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains; preload',
                true
            );
        }

        // Prevent ads and analytics
        $response->headers->set('X-Permitted-Cross-Domain-Policies', 'none', true);

        // Content Security Policy (CSP) 
        // Already handled in CspHeaders middleware, but this is backup
        if (!$response->headers->has('Content-Security-Policy') && !$response->headers->has('Content-Security-Policy-Report-Only')) {
            $csp = "default-src 'self'; "
                . "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "  // for Inertia
                . "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                . "img-src 'self' data: https:; "
                . "font-src 'self' https://fonts.gstatic.com; "
                . "connect-src 'self' https:; "
                . "frame-ancestors 'self'; "
                . "base-uri 'self'; "
                . "form-action 'self'";
            
            $response->headers->set('Content-Security-Policy', $csp);
        }

        return $response;
    }
}
