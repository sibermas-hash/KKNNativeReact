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
        'token' => env('MASTER_API_TOKEN'),
        'timeout' => env('MASTER_API_TIMEOUT', 30),
        'circuit_breaker_threshold' => env('MASTER_API_CIRCUIT_BREAKER_THRESHOLD', 5),
        'circuit_breaker_timeout' => env('MASTER_API_CIRCUIT_BREAKER_TIMEOUT', 300),
        // WARNING: current SIAKAD ignores the server-side NIM filter, so this
        // path streams the mahasiswa feed client-side. Keep disabled unless
        // the first-login provisioning tradeoff is explicitly accepted.
        'auto_provision_login' => filter_var(env('MASTER_API_AUTO_PROVISION_LOGIN', false), FILTER_VALIDATE_BOOLEAN),
        'auto_provision_cooldown_seconds' => max(60, (int) env('MASTER_API_AUTO_PROVISION_COOLDOWN_SECONDS', 900)),
        'webhook_secret' => env('MASTER_WEBHOOK_SECRET'),
        'webhook_window_seconds' => env('MASTER_WEBHOOK_WINDOW_SECONDS', 600),
    ],

    /*
     |--------------------------------------------------------------------------
     | Firebase Cloud Messaging
     |--------------------------------------------------------------------------
     | Used by App\Notifications\Channels\FcmChannel. When FCM_SERVER_KEY is
     | empty, the channel short-circuits to a no-op — safe for dev + for
     | deployments that don't use push notifications yet.
     */
    'fcm' => [
        'server_key' => env('FCM_SERVER_KEY', ''),
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID', ''),
        'client_secret' => env('GOOGLE_CLIENT_SECRET', ''),
        'redirect_uri' => env('GOOGLE_REDIRECT_URI', env('APP_URL').'/api/v1/auth/google/callback'),
    ],

    /*
     |--------------------------------------------------------------------------
     | Telegram (Ops Alerting)
     |--------------------------------------------------------------------------
     | Used by App\Services\TelegramAlertService to notify operators of
     | health degradations or critical events. Leave both blank to disable
     | (the service becomes a no-op).
     */
    'telegram' => [
        'bot_token' => env('TELEGRAM_BOT_TOKEN', ''),
        'chat_id' => env('TELEGRAM_CHAT_ID', ''),
    ],

    /*
     |--------------------------------------------------------------------------
     | Sync Behaviour
     |--------------------------------------------------------------------------
     | SYNC_SEND_WELCOME_EMAIL=false disables password-reset emails during
     | bulk sync to prevent Gmail SMTP rate-limit (454 Too many login attempts).
     | Set to true (default) for normal incremental syncs.
     */
    'sync' => [
        'send_welcome_email' => filter_var(env('SYNC_SEND_WELCOME_EMAIL', true), FILTER_VALIDATE_BOOLEAN),
    ],

];
