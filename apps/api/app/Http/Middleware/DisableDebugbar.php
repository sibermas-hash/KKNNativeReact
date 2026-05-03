<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DisableDebugbar
{
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->bound('debugbar')) {
            try {
                app('debugbar')->disable();
            } catch (\Throwable) {
                // Ignore debugbar failures so auth flow remains stable.
            }
        }

        return $next($request);
    }
}
