<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Notification Streaming
    |--------------------------------------------------------------------------
    |
    | The current realtime notification implementation uses PHP-FPM workers
    | for long-lived SSE connections. Keep it disabled by default so polling
    | remains the safe baseline on single-host deployments.
    |
    */
    'stream' => [
        'enabled' => env('NOTIFICATIONS_SSE_ENABLED', false),
    ],
];
