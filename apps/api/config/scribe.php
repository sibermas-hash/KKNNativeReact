<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    |
    | API authentication configuration for generating authenticated requests to endpoints.
    |
    */

    'auth' => [
        'enabled' => env('SCRIBE_AUTH_ENABLED', true),
        'default' => env('SCRIBE_AUTH_DEFAULT', 'sanctum'),
        'in' => 'bearer',
        'name' => 'Authorization',
        'placeholder' => 'your-token',

        'sanctum' => [
            'type' => 'bearer',
            'in' => 'bearer',
            'name' => 'Authorization',
            'description' => 'Enter your Sanctum API token. Format: Bearer {your_token}. For testing, log in via `/api/v1/auth/login` endpoint.',
            'placeholder' => 'your-token',
            'test_token' => env('SCRIBE_TEST_TOKEN'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Response Defaults
    |--------------------------------------------------------------------------
    |
    | Default HTTP response code and description for API responses.
    |
    */

    'responses' => [
        'success' => [
            'code' => 200,
            'description' => 'Success response',
            'example' => [
                'success' => true,
                'data' => [],
                'message' => 'Operation successful',
            ],
        ],
        'error' => [
            'code' => 422,
            'description' => 'Validation error or bad request',
            'example' => [
                'success' => false,
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'message' => 'Invalid input data',
                ],
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Routes to Document
    |--------------------------------------------------------------------------
    |
    | Routes to include or exclude from the API documentation.
    |
    */

    'routes' => [
        [
            'match' => [
                'domains' => ['*'],
                'prefixes' => ['api/*'],
                'versions' => ['v1'],
            ],
            'exclude' => [
                'api/v1/health*',
                'api/v1/telescope*',
                'api/v1/horizon*',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Global Headers
    |--------------------------------------------------------------------------
    |
    | Headers to include in all API requests during documentation generation.
    |
    */

    'global_headers' => [
        'Accept' => 'application/json',
        'X-App-Type' => 'web', // For platform detection
    ],

    /*
    |--------------------------------------------------------------------------
    | URL Query Parameters
    |--------------------------------------------------------------------------
    |
    | Global query parameters for API documentation.
    |
    */

    'default_query_parameters' => [
        'page' => 1,
        'per_page' => 20,
    ],

    /*
    |--------------------------------------------------------------------------
    | Body Parameters
    |--------------------------------------------------------------------------
    |
    | Default body parameters to include in API documentation.
    |
    */

    'default_body_parameters' => [
        // Add any default body parameters if needed
    ],

    /*
    |--------------------------------------------------------------------------
    | Field Filtering
    |--------------------------------------------------------------------------
    |
    | Configuration for filtering fields in API responses.
    |
    */

    'response_calls' => [
        'methods' => ['GET'],
        'config' => [
            'app.env' => 'documentation',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Gettext Helper
    |--------------------------------------------------------------------------
    |
    | If your application uses Illuminate\Support\Collection::translate, you can configure this.
    |
    */

    'gettext' => [
        'enabled' => false,
        'path' => resource_path('lang'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Group Authentication
    |--------------------------------------------------------------------------
    |
    | User authentication for API documentation generation.
    |
    */

    'try_it_out' => [
        'enabled' => true,
        'include_csrf_token' => false,
        'base_url' => env('APP_URL'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuration
    |--------------------------------------------------------------------------
    |
    | Global configuration for API documentation generation.
    |
    */

    'description' => '
        <h1>SIBERMAS API Documentation</h1>
        <p>
        Sistem Informasi Bimbingan Pengabdian Masyarakat (SIBERMAS) REST API v1.
        This documentation covers all available endpoints for KKN management at UIN Prof. K.H. Saifuddin Zuhri Purwokerto.
        </p>
        <h2>Authentication</h2>
        <p>Most endpoints require authentication via Sanctum Bearer tokens. Use the `/api/v1/auth/login` endpoint to obtain your token.</p>
        <h2>Rate Limiting</h2>
        <p>API endpoints are rate-limited to prevent abuse. Exceeding limits will result in HTTP 429 (Too Many Requests) responses.</p>
        <h2>Error Responses</h2>
        <p>All error responses follow a standard format with <code>success: false</code>, error code, and message.</p>
    ',

    'display' => [
        'example_entities' => [
            'nim' => '231012345678',
            'username' => 'student123',
            'email' => 'student@example.com',
            'name' => 'John Doe',
            'password' => 'Password123!',
        ],
    ],

    'postman' => [
        'enabled' => true,
        'name' => 'SIBERMAS API v1',
        'description' => 'SIBERMAS REST API for KKN Management',
        'export_filename' => 'sibermas-api-collection.json',
        'collection_name' => 'SIBERMAS API v1',
        'collection_base_url' => env('APP_URL').'/api/v1',
        'base_url_params' => [
            'api_path' => 'api/v1',
        ],

        'folders' => [
            'Authentication' => 'api/v1/auth',
            'Public' => 'api/v1/public',
            'Student' => 'api/v1/student',
            'DPL' => 'api/v1/dpl',
            'Admin' => 'api/v1/admin',
            'Faculty' => 'api/v1/faculty',
        ],
    ],

    'closedapi' => false,

    'custom' => [
        'endpoint' => null,
        'authentication' => [],
        'middleware' => [],
        'routeFilters' => [
            'only' => [],
            'exclude' => [
                'api/v1/telescope*',
                'api/v1/horizon*',
            ],
        ],

        'static' => [
            'baseUrl' => env('APP_URL').'/api/v1',
            'headers' => [
                'Accept' => 'application/json',
            ],

            'mixed_params' => false,
        ],

        'validator' => [
            'string_rules' => ['email', 'url', 'regex:*'],
            'number_rules' => ['numeric', 'integer', 'min', 'max', 'between', 'size'],
            'array_rules' => ['array', 'exists'],
        ],

        'data_source' => [
            'api' => 'api',
        ],
    ],

    'tag_groups' => [
        [
            'name' => 'Authentication',
            'description' => 'User authentication and authorization endpoints',
            'endpoints' => [
                'GET /api/v1/auth/captcha',
                'POST /api/v1/auth/login',
                'POST /api/v1/auth/logout',
                'GET /api/v1/auth/user',
                'POST /api/v1/auth/forgot-password',
                'POST /api/v1/auth/reset-password',
            ],
        ],
        [
            'name' => 'Public Data',
            'description' => 'Publicly accessible data endpoints',
            'endpoints' => [
                'GET /api/v1/public/faculty',
                'GET /api/v1/public/program',
                'GET /api/v1/public/type',
                'GET /api/v1/public/period',
            ],
        ],
        [
            'name' => 'Student Management',
            'description' => 'Student-specific operations',
            'endpoints' => [
                'GET /api/v1/student/dashboard',
                'POST /api/v1/student/registration',
            ],
        ],
        [
            'name' => 'DPL Management',
            'description' => 'Dosen Pembimbing Lapangan operations',
            'endpoints' => [
                'GET /api/v1/dpl/dashboard',
                'GET /api/v1/dpl/groups',
                'GET /api/v1/dpl/evaluation',
            ],
        ],
        [
            'name' => 'Admin Operations',
            'description' => 'Administrative functions',
            'endpoints' => [
                'GET /api/v1/admin/dashboard',
                'GET /api/v1/admin/users',
                'POST /api/v1/admin/users',
                'PUT /api/v1/admin/users/{id}',
                'DELETE /api/v1/admin/users/{id}',
            ],
        ],
    ],

    'output_path' => public_path('docs'),

    'type' => 'static',

    'language' => 'en',

    'additional' => [
        'Angular' => false,
        'Laravel' => false,
        'OpenAPI-Spec' => false,
    ],

    'file_layout' => 'folded',

    /*
    |--------------------------------------------------------------------------
    | Filename Modifier
    |--------------------------------------------------------------------------
    |
    | Setting this to `null` uses Scribe's default filename normalization
    | (already produces slug-friendly names). Closures MUST NOT appear in
    | config/ because `php artisan config:cache` fails to serialize them:
    |
    |   LogicException: Your configuration files could not be serialized
    |   because the value at "scribe.filename_modifier" is non-serializable.
    |
    | If custom modification is ever needed again, implement a named invokable
    | class (with `__invoke(string $filename): string`) and reference it here
    | via its FQCN string — that survives the config cache.
    */
    'filename_modifier' => null,
];
