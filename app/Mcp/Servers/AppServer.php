<?php

declare(strict_types=1);

namespace App\Mcp\Servers;

use Laravel\Mcp\Server;
use App\Mcp\Tools\GetStudentStats;

class AppServer extends Server
{
    /**
     * The tools registered with this MCP server.
     */
    protected array $tools = [
        GetStudentStats::class,
    ];

    /**
     * The resources registered with this MCP server.
     */
    public function resources(): array
    {
        return [
            'kkn://active-period' => fn() => \App\Models\KKN\Periode::where('is_active', true)->first(),
        ];
    }
}
