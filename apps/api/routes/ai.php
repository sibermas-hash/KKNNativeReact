<?php

use App\Mcp\Servers\AppServer;
use Illuminate\Support\Facades\Route;
use Laravel\Mcp\Facades\Mcp;

/**
 * AI & MCP Routes (Laravel 13 Native)
 *
 * H-010 fix:
 * - Guard with `auth:sanctum` (was `auth`, which defaults to the web guard and
 *   was unreachable from the Next.js SPA / mobile clients).
 * - Dropped `verified` — the User model does not implement MustVerifyEmail, so
 *   every request would have been rejected as unverified.
 * - Added `throttle:20,1` (20 requests per minute per user) as a simple cost
 *   guard against accidental or malicious abuse of the Gemini-backed MCP.
 *   Per-user token budgets should additionally be enforced inside AI services.
 */
Route::middleware(['auth:sanctum', 'role:admin|superadmin', 'throttle:20,1'])->group(function () {
    Mcp::web('/mcp', AppServer::class);
});
