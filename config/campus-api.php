<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Campus API Configuration
    |--------------------------------------------------------------------------
    |
    | Konfigurasi untuk integrasi dengan API Kampus
    |
    */

    // Base URL API Kampus (contoh: https://api.kampus.ac.id/v1)
    'base_url' => env('CAMPUS_API_BASE_URL', ''),

    // API Key untuk autentikasi ke API Kampus
    'api_key' => env('CAMPUS_API_KEY', ''),

    // Timeout request dalam detik
    'timeout' => 30,

    // Enable/Disable integrasi
    'enabled' => env('CAMPUS_API_ENABLED', false),

    // Retry configuration
    'retry' => [
        'max_attempts' => 3,
        'delay_seconds' => 5,
    ],

    // Endpoint mapping
    'endpoints' => [
        'mahasiswa' => '/mahasiswa',
        'dosen' => '/dosen',
        'fakultas' => '/fakultas',
        'prodi' => '/prodi',
        'tahun_akademik' => '/tahun-akademik',
    ],
];
