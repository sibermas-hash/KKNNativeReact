<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Sentry DSN
    |--------------------------------------------------------------------------
    |
    | The Sentry DSN (Data Source Name) is used to send error reports to your
    | Sentry project. Leave this empty if you don't want to use Sentry.
    |
    */

    'dsn' => env('SENTRY_LARAVEL_DSN'),

    /*
    |--------------------------------------------------------------------------
    | Sentry Environment
    |--------------------------------------------------------------------------
    |
    | The environment under which the app is running. This is used to filter
    | error reports by environment in your Sentry dashboard.
    |
    */

    'environment' => env('SENTRY_ENVIRONMENT', env('APP_ENV', 'production')),

    /*
    |--------------------------------------------------------------------------
    | Sentry Release
    |--------------------------------------------------------------------------
    |
    | The release version of your application. This helps you track errors by
    | release version. This can be set to your git tag, commit hash, or version.
    |
    */

    'release' => env('SENTRY_RELEASE', null),

    /*
    |--------------------------------------------------------------------------
    | Sentry Sample Rate
    |--------------------------------------------------------------------------
    |
    | The percentage of errors to send to Sentry. Use this to reduce cost in
    | development environment where errors are frequent. Set to 1.0 for
    | production to send all errors.
    |
    */

    'sample_rate' => (float) env('SENTRY_SAMPLE_RATE', env('APP_ENV') === 'production' ? 1.0 : 0.5),

    /*
    |--------------------------------------------------------------------------
    | Sentry Traces Sample Rate
    |--------------------------------------------------------------------------
    |
    | The percentage of transactions to send to Sentry for performance monitoring.
    | Set to 0 to disable, or higher percentage to sample more transactions.
    |
    */

    'traces_sample_rate' => (float) env('SENTRY_TRACES_SAMPLE_RATE', 0.0), // Note: for performance monitoring

    /*
    |--------------------------------------------------------------------------
    | Integrations
    |--------------------------------------------------------------------------
    |
    | The list of integrations to enable. Laravel Sentry provides several
    | integrations automatically. Customize this to add or remove integrations.
    |
    */

    'integrations' => [
        // \Sentry\Laravel\Integration::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Breadcrumb Configuration
    |--------------------------------------------------------------------------
    |
    | Breadcrumbs provide context to errors. You can configure the level of
    | breadcrumb tracking here.
    |
    */

    'breadcrumbs' => [
        'sql_queries' => true,
        'sql_bindings' => true,
        'queries' => true,
        'queue_info' => true,
        'queue_jobs' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Before Send
    |--------------------------------------------------------------------------
    |
    | This callback is called right before sending the event to Sentry.
    | You can use it to filter or modify events.
    |
    */

    'before_send' => function (callable $event): ?callable {
        // Filter out events from certain IP addresses or user-agents
        if (! empty($event['request'])) {
            // Example: Filter out health check requests
            $url = $event['request']['url'] ?? '';
            if (str_contains($url, '/health') || str_contains($url, '/ready')) {
                return null;
            }
        }

        return $event;
    },

    /*
    |--------------------------------------------------------------------------
    | User Context
    |--------------------------------------------------------------------------
    |
    | Information about the user to include in error reports. This is
    | automatically populated by Laravel's authentication system.
    |
    */

    'user_context' => [
        'id',
        'username',
        'email',
    ],

    /*
    |--------------------------------------------------------------------------
    | Report Suppressed Exceptions
    |--------------------------------------------------------------------------
    |
    | Should exceptions that are suppressed using the @ symbol be reported to Sentry?
    |
    */

    'report_suppressed' => env('SENTRY_REPORT_SUPPRESSED', false),

    /*
    |--------------------------------------------------------------------------
    | Enable Exception Level Tracking
    |--------------------------------------------------------------------------
    |
    | Whether to track the severity level of exceptions (error, warning, info, etc.)
    |
    */

    'enable_exception_level_tracking' => env('SENTRY_ENABLE_EXCEPTION_LEVEL_TRACKING', true),

    /*
    |--------------------------------------------------------------------------
    | Exclude Exception Classes
    |--------------------------------------------------------------------------
    |
    | List of exception classes to exclude from Sentry reporting.
    |
    */

    'excluded_exceptions' => [
        // \Symfony\Component\HttpKernel\Exception\NotFoundHttpException::class,
        // \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | Tags
    |--------------------------------------------------------------------------
    |
    | Global tags to include in all Sentry events.
    |
    */

    'tags' => [
        'application' => 'sibermas',
        'version' => config('app.version', '4.0.0'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Capture Events
    |--------------------------------------------------------------------------
    |
    | Which events to capture: exceptions, fatals, or all
    |
    */

    'capture_events' => [
        'exceptions' => true,
        'fatals' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Performance Monitoring
    |--------------------------------------------------------------------------
    |
    | Enable/disable performance monitoring features like transaction tracing.
    |
    */

    'performance' => [
        'monitor_slugs' => [
            // Monitor specific routes
            // '/api/v1/*',
        ],

        'ignore_slugs' => [
            // Ignore monitoring health checks
            '/health',
            '/ready',
            '/horizon*',
        ],
    ],
];
