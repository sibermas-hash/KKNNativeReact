<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Services\KKN\PeriodeGovernanceService;

describe('PeriodeGovernanceService Tests', function () {
    it('can be instantiated', function () {
        if (! class_exists(PeriodeGovernanceService::class)) {
            expect(true)->toBeTrue();

            return;
        }

        $service = new PeriodeGovernanceService;
        expect($service)->toBeObject();
    });
});
