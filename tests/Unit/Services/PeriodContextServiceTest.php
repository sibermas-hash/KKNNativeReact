<?php

namespace Tests\Unit\Services;

use App\Models\KKN\Periode;
use App\Services\PeriodContextService;
use Tests\TestCase;

class PeriodContextServiceTest extends TestCase
{
    private PeriodContextService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(PeriodContextService::class);
    }

    /** @test */
    public function it_can_get_active_periode_id(): void
    {
        $periode = Periode::factory()->create(['is_active' => true]);

        $activePeriodId = $this->service->getActivePeriodId();

        $this->assertNotNull($activePeriodId);
    }

    /** @test */
    public function it_returns_null_when_no_active_period(): void
    {
        Periode::query()->delete();

        $activePeriodId = $this->service->getActivePeriodId();

        $this->assertNull($activePeriodId);
    }

    /** @test */
    public function it_can_get_default_periode_id(): void
    {
        $periode = Periode::factory()->create();

        $defaultPeriodId = $this->service->getDefaultPeriodId();

        $this->assertNotNull($defaultPeriodId);
    }
}
