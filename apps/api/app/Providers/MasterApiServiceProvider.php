<?php

declare(strict_types=1);

namespace App\Providers;

use App\Services\MasterApi\CircuitBreakerService;
use App\Services\MasterApi\EntityMapperService;
use App\Services\MasterApi\FallbackCacheService;
use App\Services\MasterApi\MasterApiClient;
use App\Services\MasterApi\MasterApiTokenService;
use App\Services\MasterApiService;
use Illuminate\Support\ServiceProvider;

class MasterApiServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(CircuitBreakerService::class, function () {
            return new CircuitBreakerService;
        });

        $this->app->singleton(FallbackCacheService::class, function () {
            return new FallbackCacheService;
        });

        $this->app->singleton(MasterApiTokenService::class, function () {
            return new MasterApiTokenService;
        });

        $this->app->singleton(EntityMapperService::class, function () {
            return new EntityMapperService;
        });

        $this->app->singleton(MasterApiClient::class, function ($app) {
            return new MasterApiClient(
                $app->make(CircuitBreakerService::class),
                $app->make(FallbackCacheService::class),
            );
        });

        $this->app->singleton(MasterApiService::class, function ($app) {
            return new MasterApiService(
                $app->make(MasterApiClient::class),
                $app->make(MasterApiTokenService::class),
                $app->make(CircuitBreakerService::class),
                $app->make(FallbackCacheService::class),
                $app->make(EntityMapperService::class),
            );
        });
    }

    public function boot(): void
    {
        //
    }
}
