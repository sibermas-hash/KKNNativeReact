<?php

return [

    /*
     |--------------------------------------------------------------------------
     | Third Party Services
     |--------------------------------------------------------------------------
     |
     | This file is for storing the credentials for third party services such
     | as Mailgun, Postmark, AWS and more. This file provides the de facto
     | location for this type of information, allowing packages to have
     | a conventional file to locate the various service credentials.
     |
     */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'master_api' => [
        'url' => env('MASTER_API_URL'),
        'client_id' => env('MASTER_API_CLIENT_ID'),
        'client_secret' => env('MASTER_API_CLIENT_SECRET'),
        'token' => env('MASTER_API_TOKEN'),
        'cache_minutes' => env('MASTER_API_CACHE_MINUTES', 60),
        'webhook_secret' => env('MASTER_WEBHOOK_SECRET'),
        'webhook_window_seconds' => env('MASTER_WEBHOOK_WINDOW_SECONDS', 600),
        
        // Circuit breaker configuration
        'circuit_breaker_threshold' => env('MASTER_API_CIRCUIT_BREAKER_THRESHOLD', 5),
        'circuit_breaker_timeout' => env('MASTER_API_CIRCUIT_BREAKER_TIMEOUT', 300), // 5 minutes
        
        // Retry configuration
        'retry_max_attempts' => env('MASTER_API_RETRY_MAX_ATTEMPTS', 3),
        'retry_initial_delay' => env('MASTER_API_RETRY_INITIAL_DELAY', 300), // 300ms
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
    ],

];
