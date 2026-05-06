<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Horizon Domain
    |--------------------------------------------------------------------------
    |
    | This is the subdomain where Horizon will be accessible from. If this
    | setting is null, Horizon will reside under the same domain as the
    | application. Otherwise, Horizon's root path will be the subdomain.
    |
    */

    'domain' => env('HORIZON_DOMAIN'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Path
    |--------------------------------------------------------------------------
    |
    | This is the URI path where Horizon will be accessible from. Feel free
    | to change this path to anything you like. Note that this will not
    | affect the path of Horizon's internal API that isn't exposed to users.
    |
    */

    'path' => env('HORIZON_PATH', 'horizon'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Redis Connection
    |--------------------------------------------------------------------------
    |
    | This is the name of the Redis connection where Horizon will store the
    | metrics and master keys which are used for the dashboard and commands.
    |
    */

    'use' => 'default',

    /*
    |--------------------------------------------------------------------------
    | Horizon Redis Prefix
    |--------------------------------------------------------------------------
    |
    | This prefix will be used when storing all Horizon data in Redis. You
    | may modify the prefix when you are running multiple applications
    | with the same Redis installation.
    |
    */

    'prefix' => env(
        'HORIZON_PREFIX',
        'laravel_horizon:'
    ),

    /*
    |--------------------------------------------------------------------------
    | Horizon Route Middleware
    |--------------------------------------------------------------------------
    |
    | These middleware will get attached onto each Horizon route, giving you
    | the chance to add your own middleware to this list or change any of
    | the existing middleware. Or, you can simply stick with this list.
    |
    */

    'middleware' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Queue Wait Time Thresholds
    |--------------------------------------------------------------------------
    |
    | You may define a queue wait time threshold (in seconds) for each of
    | your queues. If a job has been waiting longer than this threshold,
    | it will be counted as long-waiting. This is valuable for detecting
    | queue health issues.
    |
    */

    'waits' => [
        'default' => 60,
        'critical' => 30,
        'high' => 30,
        'low' => 60,
    ],

    /*
    |--------------------------------------------------------------------------
    | Queue Worker Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may define the queue worker settings used by your application
    | when running Horizon. Each profile settings may have a different
    | number of workers, daemon limits, and queue priorities.
    |
    */

    'environments' => [
        'production' => [
            'supervisor-1' => [
                'connection' => env('HORIZON_CONNECTION', 'redis'),
                'queue' => ['default', 'critical', 'high'],
                'balance' => 'auto',
                'minProcesses' => 1,
                'maxProcesses' => 10,
                'nice' => 0,
                'timeout' => 300,
            ],
            'supervisor-low' => [
                'connection' => env('HORIZON_CONNECTION', 'redis'),
                'queue' => ['low'],
                'balance' => 'auto',
                'minProcesses' => 1,
                'maxProcesses' => 5,
                'nice' => 10,
                'timeout' => 600,
            ],
        ],

        'local' => [
            'supervisor-1' => [
                'connection' => env('HORIZON_CONNECTION', 'database'),
                'queue' => ['default', 'critical', 'high', 'low'],
                'balance' => 'auto',
                'minProcesses' => 1,
                'maxProcesses' => 3,
                'nice' => 0,
                'timeout' => 300,
            ],
        ],

        'testing' => [
            'supervisor-1' => [
                'connection' => env('HORIZON_CONNECTION', 'sync'),
                'queue' => ['default', 'critical', 'high', 'low'],
                'balance' => 'auto',
                'minProcesses' => 1,
                'maxProcesses' => 3,
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Fast Expiry Times
    |--------------------------------------------------------------------------
    |
    | Horizon uses fast expiry times for all of its metrics keys to keep the
    | performance of the dashboard snappy. These values control the time
    | in seconds that the metrics remain in Redis before being expired.
    |
    */

    'fast_expiry' => 21600,

    /*
    |--------------------------------------------------------------------------
    | Trim Length for Metrics
    |--------------------------------------------------------------------------
    |
    | Trimming allows you to limit the length of job tags and queue names
    | in your metrics. This helps improve the performance of your queue
    | database commands.
    |
    */

    'trim' => [
        'recent' => 600,
        'completed' => 1000,
        'failed' => 500,
    ],

    /*
    |--------------------------------------------------------------------------
    | Command Trimming Frequency
    |--------------------------------------------------------------------------
    |
    | This configuration option determines how often Horizon will analyze
    | and trim the job tag queue counts. The default should be sufficient,
    | but you may adjust based on your application's workload.
    |
    */

    'trim_margins' => [
        'recent' => 60,
        'completed' => 2000,
        'failed' => 5000,
    ],

    /*
    |--------------------------------------------------------------------------
    | Silenced Jobs
    |--------------------------------------------------------------------------
    |
    | Sometimes you might wish to silence certain jobs so they are not
    | monitored by Horizon. You may configure the job classes here.
    |
    */

    'silenced' => [
        // App\Jobs\ExampleJob::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Metrics Key Prefix
    |--------------------------------------------------------------------------
    |
    | This prefix will be used when storing all Horizon metrics keys in Redis.
    | This will allow you to use the same Redis connection for multiple
    | applications without conflicting metrics.
    |
    */

    'metrics_key_prefix' => env(
        'HORIZON_METRICS_PREFIX',
        'horizon_metrics:'
    ),

    /*
    |--------------------------------------------------------------------------
    | Recent Job Limit
    |--------------------------------------------------------------------------
    |
    | This limits the number of recent jobs that are stored by Horizon. The
    | default value is set to show the last 1,000 jobs, which should be
    | sufficient for most typical applications.
    |
    */

    'recent_job_limit' => 1000,

    /*
    |--------------------------------------------------------------------------
    | Authentication Configuration
    |--------------------------------------------------------------------------
    |
    | Horizon authentication is handled by the HorizonServiceProvider.
    | Access is restricted to users with 'superadmin' or 'admin' roles.
    |
    */

    'auth' => [
        /*
        |--------------------------------------------------------------------------
        | Authentication Strategy
        |--------------------------------------------------------------------------
        |
        | The authentication strategy determines how Horizon authenticates
        | requests. Options: 'session', 'basic', 'api'.
        |
        */
        'strategy' => env('HORIZON_AUTH_STRATEGY', 'session'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Notification Configuration
    |--------------------------------------------------------------------------
    |
    | Horizon can send notifications when waits exceed a given threshold or
    | when it fails to process a job. You may configure the notifications here.
    |
    */

    'notifiers' => [
        'recipients' => [
            // Add your notification recipients here
            // env('HORIZON_NOTIFICATION_EMAIL', 'admin@example.com'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Snapshot Configuration
    |--------------------------------------------------------------------------
    |
    | You may configure how often (in minutes) Horizon should take a snapshot
    | of the queue metrics and store it in Redis for later retrieval.
    |
    */

    'trim_snapshots' => [
        'recent' => 60,
        'completed' => 1000,
        'failed' => 500,
        'batches' => 100,
    ],

    /*
    |--------------------------------------------------------------------------
    | Stale Job Detection
    |--------------------------------------------------------------------------
    |
    | You may configure the number of seconds a job can run before being
    | considered "stale". Stale jobs are highlighted in the Horizon dashboard.
    |
    */

    'stale_mins' => 30,

    /*
    |--------------------------------------------------------------------------
    | Worker Timeout Configuration
    |--------------------------------------------------------------------------
    |
    | You may configure how long (in seconds) Horizon workers may run before
    | being terminated. The default is set to 60 minutes, which is suitable
    | for most long-running job operations.
    |
    */

    'worker_timeout' => 3600,
];
