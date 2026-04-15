<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Services\KKN\IntelligenceService;
use PHPUnit\Framework\TestCase;

class IntelligenceServiceTest extends TestCase
{
    public function test_service_class_exists(): void
    {
        $this->assertTrue(class_exists(IntelligenceService::class));
    }

    public function test_method_get_high_risk_anomalies_exists(): void
    {
        $this->assertTrue(method_exists(IntelligenceService::class, 'getHighRiskAnomalies'));
    }

    public function test_method_get_high_risk_count_exists(): void
    {
        $this->assertTrue(method_exists(IntelligenceService::class, 'getHighRiskCount'));
    }

    public function test_class_has_correct_namespace(): void
    {
        $reflection = new \ReflectionClass(IntelligenceService::class);
        $this->assertEquals('App\Services\KKN', $reflection->getNamespaceName());
    }
}
