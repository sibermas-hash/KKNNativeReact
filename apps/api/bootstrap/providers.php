<?php

use App\Providers\AiConfigServiceProvider;
use App\Providers\AppServiceProvider;
use App\Providers\HorizonServiceProvider;
use App\Providers\ImageServiceProvider;
use App\Providers\MasterApiServiceProvider;
use App\Providers\McpServiceProvider;
use Laravel\Ai\AiServiceProvider;

return [
    AiConfigServiceProvider::class,
    AppServiceProvider::class,
    HorizonServiceProvider::class,
    ImageServiceProvider::class,
    MasterApiServiceProvider::class,
    McpServiceProvider::class,
    AiServiceProvider::class,
];
