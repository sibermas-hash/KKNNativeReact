<?php

declare(strict_types=1);

namespace App\Mcp\Servers;

use App\Mcp\Tools\GetStudentStats;
use App\Models\KKN\Periode;
use Laravel\Mcp\Server;

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
            'kkn://active-period' => fn () => Periode::where('is_active', true)->first(),
        ];
    }
}
