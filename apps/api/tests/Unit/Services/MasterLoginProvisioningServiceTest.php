<?php

declare(strict_types=1);

use App\Services\MasterApiService;
use App\Services\MasterLoginProvisioningService;
use App\Services\StudentSyncService;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

uses(TestCase::class);

describe('Master login provisioning service', function () {
    beforeEach(function () {
        Cache::flush();
    });

    afterEach(function () {
        Cache::flush();
        Mockery::close();
    });

    it('is disabled by default', function () {
        config([
            'services.master_api.auto_provision_login' => false,
            'services.master_api.auto_provision_cooldown_seconds' => 900,
        ]);

        $masterApi = Mockery::mock(MasterApiService::class);
        $studentSync = Mockery::mock(StudentSyncService::class);

        $masterApi->shouldNotReceive('getStudentsByNimList');
        $studentSync->shouldNotReceive('upsertStudent');

        $service = new MasterLoginProvisioningService($masterApi, $studentSync);

        expect($service->provisionStudentForLogin('230103012345'))->toBeFalse();
    });

    it('ignores non numeric login identifiers', function () {
        config([
            'services.master_api.auto_provision_login' => true,
            'services.master_api.auto_provision_cooldown_seconds' => 900,
        ]);

        $masterApi = Mockery::mock(MasterApiService::class);
        $studentSync = Mockery::mock(StudentSyncService::class);

        $masterApi->shouldNotReceive('getStudentsByNimList');
        $studentSync->shouldNotReceive('upsertStudent');

        $service = new MasterLoginProvisioningService($masterApi, $studentSync);

        expect($service->provisionStudentForLogin('superadmin'))->toBeFalse();
        expect($service->provisionStudentForLogin('dosen-uinsaizu'))->toBeFalse();
    });

    it('provisions a student account and suppresses welcome email during login fallback', function () {
        config([
            'services.master_api.auto_provision_login' => true,
            'services.master_api.auto_provision_cooldown_seconds' => 900,
        ]);

        $studentRecord = [
            'nim' => '230103012345',
            'nama' => 'Mahasiswa Sinkron',
            'tanggal_lahir' => '2004-01-02',
        ];

        $masterApi = Mockery::mock(MasterApiService::class);
        $studentSync = Mockery::mock(StudentSyncService::class);

        $masterApi->shouldReceive('getStudentsByNimList')
            ->once()
            ->with(['230103012345'])
            ->andReturn([$studentRecord]);

        $studentSync->shouldReceive('upsertStudent')
            ->once()
            ->with($studentRecord, true, false)
            ->andReturn(true);

        $service = new MasterLoginProvisioningService($masterApi, $studentSync);

        expect($service->provisionStudentForLogin('230103012345'))->toBeTrue();
    });

    it('throttles repeated provisioning attempts for the same login identifier', function () {
        config([
            'services.master_api.auto_provision_login' => true,
            'services.master_api.auto_provision_cooldown_seconds' => 900,
        ]);

        $masterApi = Mockery::mock(MasterApiService::class);
        $studentSync = Mockery::mock(StudentSyncService::class);

        $masterApi->shouldReceive('getStudentsByNimList')
            ->once()
            ->with(['230103099999'])
            ->andReturn([]);

        $studentSync->shouldNotReceive('upsertStudent');

        $service = new MasterLoginProvisioningService($masterApi, $studentSync);

        expect($service->provisionStudentForLogin('230103099999'))->toBeFalse();
        expect($service->provisionStudentForLogin('230103099999'))->toBeFalse();
    });
});
