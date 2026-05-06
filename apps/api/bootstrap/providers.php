<?php

use App\Providers\AiConfigServiceProvider;
use App\Providers\AppServiceProvider;
use App\Providers\HorizonServiceProvider;
use App\Providers\ImageServiceProvider;
use App\Providers\MasterApiServiceProvider;
use App\Providers\McpServiceProvider;
use App\Providers\TelescopeServiceProvider;
use Laravel\Ai\AiServiceProvider;

return [
    AppServiceProvider::class,
    MasterApiServiceProvider::class,
    TelescopeServiceProvider::class,
    HorizonServiceProvider::class,
    AiConfigServiceProvider::class,
    AiServiceProvider::class,
    McpServiceProvider::class,
    ImageServiceProvider::class,
];
