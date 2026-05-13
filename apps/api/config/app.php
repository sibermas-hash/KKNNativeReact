<?php

return [

    'name' => env('APP_NAME', 'SIBERMAS'),

    'env' => env('APP_ENV', 'production'),

    'debug' => (bool) env('APP_DEBUG', false),

    'url' => env('APP_URL', 'http://localhost'),

    'frontend_url' => env('APP_FRONTEND_URL', env('FRONTEND_URL', env('APP_URL', 'http://localhost'))),

    'asset_url' => env('ASSET_URL'),

    'timezone' => 'Asia/Jakarta',

    'locale' => 'id',

    'fallback_locale' => 'en',

    'faker_locale' => 'en_US',

    'key' => env('APP_KEY'),

    'cipher' => 'AES-256-CBC',

    /*
    |--------------------------------------------------------------------------
    | Blind Index Key (PII Phase 2)
    |--------------------------------------------------------------------------
    |
    | Server-side HMAC-SHA256 key for computing blind indexes on encrypted
    | PII columns. See App\Traits\HasBlindIndex and docs/PII_ENCRYPTION_PLAN.md.
    |
    | Generate once: `php artisan tinker --execute='echo base64_encode(random_bytes(32));'`
    | or `openssl rand -base64 32`. Store in APP_BLIND_INDEX_KEY env.
    |
    | Rotating this key INVALIDATES all existing blind-index columns; a
    | recompute-backfill command must run before deploying a rotated key.
    |
    */

    'blind_index_key' => env('APP_BLIND_INDEX_KEY'),

    'maintenance' => [
        'driver' => 'file',
    ],

];
