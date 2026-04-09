<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Production Rate Limiting Configuration
    |--------------------------------------------------------------------------
    |
    | Configure rate limits for different endpoints and user types.
    | Format: 'max_requests,decay_minutes'
    |
    */

    'limits' => [
        // Authentication endpoints - STRICT
        'login' => [
            'attempts' => 5,
            'decay' => 15,  // minutes
            'message' => 'Terlalu banyak percobaan login. Coba lagi dalam :seconds detik.'
        ],
        
        'password_reset' => [
            'attempts' => 3,
            'decay' => 1440,  // 24 hours
            'message' => 'Terlalu banyak permintaan reset password. Coba lagi besok.'
        ],
        
        'password_email' => [
            'attempts' => 3,
            'decay' => 1440,  // 24 hours
            'message' => 'Terlalu banyak permintaan email. Coba lagi besok.'
        ],

        // Registration endpoints - MODERATE
        'registration' => [
            'attempts' => 10,
            'decay' => 60,  // 1 hour
            'message' => 'Terlalu banyak pendaftaran dari IP Anda. Coba lagi nanti.'
        ],

        // API endpoints - MODERATE
        'api' => [
            'authenticated' => [
                'attempts' => 100,
                'decay' => 1,  // 1 minute
            ],
            'guest' => [
                'attempts' => 30,
                'decay' => 1,  // 1 minute
            ]
        ],

        // Public endpoints - RELAXED
        'public' => [
            'attempts' => 60,
            'decay' => 1,  // 1 minute
        ],

        // File operations - MODERATE
        'uploads' => [
            'attempts' => 20,
            'decay' => 1,  // 1 minute
        ],

        // Report generation - RELAXED
        'reports' => [
            'attempts' => 10,
            'decay' => 1,  // 1 minute
        ],

        // Certificate verification - RELAXED
        'certificate_verify' => [
            'attempts' => 30,
            'decay' => 1,  // 1 minute
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Critical Endpoints Requiring Stricter Limits
    |--------------------------------------------------------------------------
    |
    | These endpoints need extra protection against abuse:
    |
    */

    'critical_endpoints' => [
        'password.email',
        'password.update',
        'login.store',
        'student.registration.store',
        'student.registration.leave',
        'admin.rekap-nilai.finalize-mass',
        'admin.audit-log.index',
        'dpl.evaluations.import',
    ],

    /*
    |--------------------------------------------------------------------------
    | IP Whitelist/Blacklist
    |--------------------------------------------------------------------------
    |
    | IP addresses to always allow or block
    |
    */

    'whitelist' => [
        // 'localhost',
        // '127.0.0.1',
        // Add internal IPs here
    ],

    'blacklist' => [
        // Add known bad IPs here
    ],

    /*
    |--------------------------------------------------------------------------
    | Response Behavior
    |--------------------------------------------------------------------------
    |
    | How to handle rate limit violations
    |
    */

    'responses' => [
        'log_violations' => true,
        'email_admin' => true,
        'admin_email' => env('ADMIN_EMAIL', 'admin@domain.com'),
        'violation_threshold' => 100,  // Log after N violations/hour
    ],

    /*
    |--------------------------------------------------------------------------
    | Monitoring & Alerts
    |--------------------------------------------------------------------------
    |
    | Set up alerts for suspicious activity
    |
    */

    'monitoring' => [
        'enabled' => true,
        'high_load_threshold' => 80,  // % of limit
        'alert_channels' => ['log', 'email'],  // Where to send alerts
        'check_interval' => 60,  // seconds
    ],
];
