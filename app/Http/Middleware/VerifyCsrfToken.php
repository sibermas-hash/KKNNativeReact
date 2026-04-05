<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * Indicates whether the XSRF-TOKEN cookie should be set on the response.
     *
     * @var bool
     */
    protected $addHttpCookie = true;

    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * TEMPORARY: Only for debugging 419 issue — REMOVE after root cause found.
     *
     * @var array<int, string>
     */
    protected $except = [
        // All clear for now — no exceptions
    ];
}
