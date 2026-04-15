<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Services\MasterApi\CircuitBreakerService;
use App\Services\MasterApi\EntityMapperService;
use App\Services\MasterApi\FallbackCacheService;
use App\Services\MasterApi\MasterApiClient;
use App\Services\MasterApi\MasterApiTokenService;
use App\Services\MasterApiService;
use PHPUnit\Framework\TestCase;

class MasterApiServicesTest extends TestCase
{
    public function test_master_api_client_exists(): void
    {
        $this->assertTrue(class_exists(MasterApiClient::class));
    }

    public function test_circuit_breaker_service_exists(): void
    {
        $this->assertTrue(class_exists(CircuitBreakerService::class));
    }

    public function test_fallback_cache_service_exists(): void
    {
        $this->assertTrue(class_exists(FallbackCacheService::class));
    }

    public function test_entity_mapper_service_exists(): void
    {
        $this->assertTrue(class_exists(EntityMapperService::class));
    }

    public function test_token_service_exists(): void
    {
        $this->assertTrue(class_exists(MasterApiTokenService::class));
    }

    public function test_master_api_service_facade_exists(): void
    {
        $this->assertTrue(class_exists(MasterApiService::class));
    }
}
