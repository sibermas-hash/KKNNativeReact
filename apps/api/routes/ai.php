<?php

use App\Mcp\Servers\AppServer;
use Illuminate\Support\Facades\Route;
use Laravel\Mcp\Facades\Mcp;

/**
 * AI & MCP Routes (Laravel 13 Native)
 * Defined to expose application tools and resources to AI agents via MCP Servers.
 */
Route::middleware(['auth', 'role:admin|superadmin', 'verified'])->group(function () {
    Mcp::web('/mcp', AppServer::class);
});
