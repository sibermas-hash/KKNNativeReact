<?php

$frontendUrl = trim((string) env('APP_FRONTEND_URL', env('FRONTEND_URL', '')));
$appUrl = trim((string) env('APP_URL', ''));
$productionOrigin = $frontendUrl !== '' ? rtrim($frontendUrl, '/') : '';

if ($productionOrigin === '' && $appUrl !== '') {
    $scheme = parse_url($appUrl, PHP_URL_SCHEME);
    $host = parse_url($appUrl, PHP_URL_HOST);
    $port = parse_url($appUrl, PHP_URL_PORT);

    if (is_string($scheme) && $scheme !== '' && is_string($host) && $host !== '') {
        $productionOrigin = sprintf('%s://%s%s', $scheme, $host, is_int($port) ? ':'.$port : '');
    }
}

$defaultAllowedOrigins = env('APP_ENV') === 'production'
    ? ($productionOrigin !== '' ? $productionOrigin : 'https://sibermas.uinsaizu.ac.id')
    : 'http://localhost:3000,http://localhost:8000,capacitor://localhost,http://localhost';

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('CORS_ALLOWED_ORIGINS', $defaultAllowedOrigins))
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Authorization', 'Content-Type', 'Accept', 'X-Requested-With', 'X-App-Type', 'X-XSRF-TOKEN', 'x-xsrf-token'],

    'exposed_headers' => [],

    'max_age' => 7200,

    'supports_credentials' => true,
];
