<?php

namespace Tests\Unit\Services;

use App\Models\KKN\Periode;
use App\Services\PeriodContextService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Session;
use Tests\TestCase;

class PeriodContextServiceTest extends TestCase
{
    private PeriodContextService $service;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        Session::flush();
        $this->service = app(PeriodContextService::class);
    }

    /** @test */
    public function it_can_get_active_periode_id(): void
    {
        $periode = Periode::factory()->create(['is_active' => true]);

        $this->service->setActivePeriod($periode->id);
        $activePeriodId = $this->service->getActivePeriodId();

        $this->assertEquals($periode->id, $activePeriodId);
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
        $periode = Periode::factory()->create(['is_active' => true]);

        $defaultPeriodId = $this->service->getDefaultPeriodId();

        $this->assertEquals($periode->id, $defaultPeriodId);
    }
}
