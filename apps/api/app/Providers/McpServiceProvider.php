<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class McpServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // MCP Server - Enable via .env: MCP_ENABLED=true
        // Basic setup - full MCP config can be added later
        if (env('MCP_ENABLED', false)) {
            $this->setupMcpServer();
        }
    }

    private function setupMcpServer(): void
    {
        // Laravel MCP is already registered via AiServiceProvider
        // Additional custom tools can be added here
    }
}
