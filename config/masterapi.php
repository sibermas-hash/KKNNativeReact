<?php

return [
    'base' => env('MASTER_API_URL', env('MASTER_API_BASE_URL', env('MASTER_API_BASE', ''))),
    'token' => env('MASTER_API_TOKEN', ''),
    'timeout' => (int) env('MASTER_API_TIMEOUT', 10),
];
