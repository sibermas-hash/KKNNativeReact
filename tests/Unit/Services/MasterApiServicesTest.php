<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use PHPUnit\Framework\TestCase;

class MasterApiServicesTest extends TestCase
{
    public function test_master_api_client_exists(): void
    {
        $this->assertTrue(class_exists(\App\Services\MasterApi\MasterApiClient::class));
    }

    public function test_circuit_breaker_service_exists(): void
    {
        $this->assertTrue(class_exists(\App\Services\MasterApi\CircuitBreakerService::class));
    }

    public function test_fallback_cache_service_exists(): void
    {
        $this->assertTrue(class_exists(\App\Services\MasterApi\FallbackCacheService::class));
    }

    public function test_entity_mapper_service_exists(): void
    {
        $this->assertTrue(class_exists(\App\Services\MasterApi\EntityMapperService::class));
    }

    public function test_token_service_exists(): void
    {
        $this->assertTrue(class_exists(\App\Services\MasterApi\MasterApiTokenService::class));
    }

    public function test_master_api_service_facade_exists(): void
    {
        $this->assertTrue(class_exists(\App\Services\MasterApiService::class));
    }
}
