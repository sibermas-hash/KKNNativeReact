<?php

use App\Providers\AppServiceProvider;
use App\Providers\MasterApiServiceProvider;
use App\Providers\TelescopeServiceProvider;
use Laravel\Ai\AiServiceProvider;

return [
    AppServiceProvider::class,
    MasterApiServiceProvider::class,
    TelescopeServiceProvider::class,
    AiServiceProvider::class,
];
