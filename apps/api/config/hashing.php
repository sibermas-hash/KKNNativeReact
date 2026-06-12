<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Hash Driver
    |--------------------------------------------------------------------------
    |
    | This option controls the default hash driver that will be used to hash
    | passwords for your application. By default, the Argon2id algorithm
    | is used for maximum security.
    |
    */

    'driver' => env('HASHING_DRIVER', 'argon2id'),

    /*
    |--------------------------------------------------------------------------
    | Bcrypt Options
    |--------------------------------------------------------------------------
    */

    'bcrypt' => [
        'rounds' => env('BCRYPT_ROUNDS', 12),
        'verify' => true,
        'limit' => null,
    ],

    /*
    |--------------------------------------------------------------------------
    | Argon Options
    |--------------------------------------------------------------------------
    |
    | Used for both Argon2i and Argon2id algorithms.
    |
    | memory: Maximum memory (in KB) that may be used to compute the hash.
    | threads: Number of threads to use for computing the hash.
    | time: Maximum number of seconds that may be spent computing the hash.
    | verify: Whether to verify the hash on check.
    |
    */

    'argon' => [
        'memory' => env('ARGON_MEMORY', 65536),
        'threads' => env('ARGON_THREADS', 2),
        'time' => env('ARGON_TIME', 4),
        'verify' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Rehash On Login
    |--------------------------------------------------------------------------
    |
    | This option determines if the hash should be rehashed when the user
    | logs in and the hash parameters don't match the current defaults.
    |
    */

    'rehash_on_login' => true,

];
