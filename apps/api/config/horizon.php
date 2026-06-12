<?php

use Illuminate\Support\Str;

return [
    'domain' => null,
    'path' => 'horizon',
    'use' => 'default',
    'prefix' => env('HORIZON_PREFIX', Str::slug(env('APP_NAME', 'laravel')).'-horizon:'),
    'middleware' => ['web', 'auth:sanctum'],
    'waits' => ['redis:default' => 30, 'redis:long' => 60, 'redis:low' => 120],
    'trim' => ['recent' => 60, 'pending' => 60, 'completed' => 60, 'recent_failed' => 10080, 'failed' => 10080, 'monitored' => 10080],
    'silenced' => [],
    'metrics' => ['trim_snapshots' => ['job' => 24, 'queue' => 24]],
    'fast_termination' => true,
    'memory_limit' => 256,

    'defaults' => [
        'supervisor-default' => [
            'connection' => 'redis',
            'queue' => ['default'],
            'balance' => 'auto',
            'autoScalingStrategy' => 'time',
            'minProcesses' => 2,
            'maxProcesses' => 10,
            'maxTime' => 3600,
            'maxJobs' => 1000,
            'memory' => 256,
            'tries' => 3,
            'timeout' => 90,
            'nice' => 0,
            'rest' => 0,
        ],
    ],

    'environments' => [
        'production' => [
            'supervisor-default' => [
                'connection' => 'redis',
                'queue' => ['default'],
                'balance' => 'auto',
                'minProcesses' => 4,
                'maxProcesses' => 16,
                'balanceMaxShift' => 3,
                'balanceCooldown' => 3,
                'memory' => 256,
                'tries' => 3,
                'timeout' => 90,
            ],
            'supervisor-long' => [
                'connection' => 'redis',
                'queue' => ['long'],
                'balance' => 'simple',
                'minProcesses' => 2,
                'maxProcesses' => 6,
                'memory' => 512,
                'tries' => 2,
                'timeout' => 600,
            ],
            'supervisor-low' => [
                'connection' => 'redis',
                'queue' => ['low'],
                'balance' => 'auto',
                'minProcesses' => 1,
                'maxProcesses' => 4,
                'memory' => 128,
                'tries' => 3,
                'timeout' => 120,
            ],
        ],

        'local' => [
            'supervisor-default' => [
                'maxProcesses' => 3,
            ],
        ],
    ],
];
