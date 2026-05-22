<?php
return [
    'enabled' => env('WA_GATEWAY_ENABLED', false),
    'url' => rtrim((string) env('WA_GATEWAY_URL', ''), '/'),
    'api_key' => env('WA_GATEWAY_API_KEY'),
    'session' => env('WA_GATEWAY_SESSION'),
    'timeout' => (int) env('WA_GATEWAY_TIMEOUT', 10),
];
