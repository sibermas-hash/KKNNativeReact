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
    // Enable explicitly only when there is an approval process around it.
    'self_service_enabled' => (bool) env('API_SELF_SERVICE_ENABLED', false),

    // Whitelist of database tables accessible via the public data API.
    // Table names should match PostgreSQL table names exactly.
    // Empty array = no tables accessible (safe default).
    'allowed_tables' => [
        'mahasiswa',
        'dosen',
        'fakultas',
        'prodi',
        'kelompok_kkn',
        'lokasi',
        'periode',
        'tahun_akademik',
    ],

    // Rate limit: max requests per minute per API key.
    'rate_limit' => (int)env('API_KEY_RATE_LIMIT', 60),

];
