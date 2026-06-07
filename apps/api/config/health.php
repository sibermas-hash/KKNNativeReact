<?php

use Spatie\Health\Checks\Checks\CacheCheck;
use Spatie\Health\Checks\Checks\DatabaseCheck;
use Spatie\Health\Checks\Checks\DebugModeCheck;
use Spatie\Health\Checks\Checks\EnvironmentCheck;
use Spatie\Health\Checks\Checks\HorizonCheck;
use Spatie\Health\Checks\Checks\OptimizedAppCheck;
use Spatie\Health\Checks\Checks\RedisCheck;
use Spatie\Health\Checks\Checks\UsedDiskSpaceCheck;
use Spatie\Health\ResultStores\CacheHealthResultStore;

return [
    'result_stores' => [
        CacheHealthResultStore::class => [
            'store' => 'redis',
        ],
    ],

    'notifications' => [
        'enabled' => false,
    ],

    'checks' => [
        CacheCheck::class,
        DatabaseCheck::class,
        DebugModeCheck::class,
        EnvironmentCheck::class,
        HorizonCheck::class,
        OptimizedAppCheck::class,
        RedisCheck::class,
        UsedDiskSpaceCheck::class,
    ],
];
