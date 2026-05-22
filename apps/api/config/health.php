<?php

return [
    'result_stores' => [
        Spatie\Health\ResultStores\CacheHealthResultStore::class => [
            'store' => 'redis',
        ],
    ],

    'notifications' => [
        'enabled' => false,
    ],

    'checks' => [
        Spatie\Health\Checks\Checks\CacheCheck::class,
        Spatie\Health\Checks\Checks\DatabaseCheck::class,
        Spatie\Health\Checks\Checks\DebugModeCheck::class,
        Spatie\Health\Checks\Checks\EnvironmentCheck::class,
        Spatie\Health\Checks\Checks\HorizonCheck::class,
        Spatie\Health\Checks\Checks\OptimizedAppCheck::class,
        Spatie\Health\Checks\Checks\RedisCheck::class,
        Spatie\Health\Checks\Checks\UsedDiskSpaceCheck::class,
    ],
];
