<?php

return [

    /*
     |--------------------------------------------------------------------------
     | API Key System Configuration
     |--------------------------------------------------------------------------
     */

    // Secret for admin key generation endpoint.
    // Must match x-admin-secret header in requests to POST /api/admin/keys.
    'admin_secret' => env('API_ADMIN_SECRET'),

    // Public self-service registration is disabled by default.
    // Enable explicitly only when there is a documented approval process.
    // For safety, force disabled unless env explicitly sets it to true.
    'self_service_enabled' => false,

    // Whitelist of database tables accessible via the public data API.
    // Table names should match PostgreSQL table names exactly.
    // SECURITY: Default to empty array to prevent accidental exposure. Add tables only after security review.
    'allowed_tables' => [],

    // Rate limit: max requests per minute per API key.
    'rate_limit' => (int) env('API_KEY_RATE_LIMIT', 60),

];
