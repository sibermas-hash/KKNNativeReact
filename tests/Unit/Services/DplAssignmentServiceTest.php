<?php

namespace Tests\Unit\Services;

use App\Models\KKN\Dosen;
use App\Models\KKN\DplKecamatanAssignment;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Periode;
use App\Models\User;
use App\Services\DplAssignmentService;
use App\Services\DplEligibilityService;
use App\Services\DplProvisioningService;
use DomainException;
use Illuminate\Support\Facades\DB;
use Mockery;
use Tests\TestCase;

class DplAssignmentServiceTest extends TestCase
{
    private DplProvisioningService $provisioningMock;

    private DplEligibilityService $eligibilityMock;

    private DplAssignmentService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->provisioningMock = Mockery::mock(DplProvisioningService::class);
        $this->eligibilityMock = Mockery::mock(DplEligibilityService::class);
        $this->service = new DplAssignmentService($this->provisioningMock, $this->eligibilityMock);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_activate_for_period_creates_assignment(): void
    {
        $dosen = Dosen::factory()->create();
        $periode = Periode::factory()->create();
        $user = User::factory()->create();

        $provisioningResult = [
            'user' => $user,
            'created' => true,
            'activated' => true,
            'temp_password' => 'temppass123',
        ];

        $this->provisioningMock
            ->shouldReceive('ensureDplAccount')
            ->with($dosen)
            ->once()
            ->andReturn($provisioningResult);

        $this->eligibilityMock
            ->shouldReceive('isQualifiedForDpl')
            ->with($dosen, $periode->id)
            ->once()
            ->andReturn(['eligible' => true]);

        $result = $this->service->activateForPeriod($dosen, $periode, 5);

        $this->assertArrayHasKey('assignment', $result);
        $this->assertArrayHasKey('provisioning', $result);
        $this->assertTrue($result['assignment']->is_active);
        $this->assertSame(5, $result['assignment']->max_kelompok_kkn);
        $this->assertSame($dosen->id, $result['assignment']->dosen_id);
        $this->assertSame($periode->id, $result['assignment']->periode_id);
    }

    public function test_activate_for_period_updates_existing_assignment(): void
    {
        $dosen = Dosen::factory()->create();
        $periode = Periode::factory()->create();
        $user = User::factory()->create();

        DplPeriod::create([
            'dosen_id' => $dosen->id,
            'periode_id' => $periode->id,
            'max_kelompok_kkn' => 3,
            'is_active' => false,
        ]);

        $this->provisioningMock
            ->shouldReceive('ensureDplAccount')
            ->with($dosen)
            ->once()
            ->andReturn([
                'user' => $user,
                'created' => false,
                'activated' => false,
                'temp_password' => null,
            ]);

        $this->eligibilityMock
            ->shouldReceive('isQualifiedForDpl')
            ->with($dosen, $periode->id)
            ->once()
            ->andReturn(['eligible' => true]);

        $result = $this->service->activateForPeriod($dosen, $periode, 10);

        $this->assertTrue($result['assignment']->is_active);
        $this->assertSame(10, $result['assignment']->max_kelompok_kkn);
    }

    public function test_assign_primary_group_throws_when_dpl_not_active(): void
    {
        $dosen = Dosen::factory()->create();
        $periode = Periode::factory()->create();

        $dplPeriod = DplPeriod::create([
            'dosen_id' => $dosen->id,
            'periode_id' => $periode->id,
            'max_kelompok_kkn' => 5,
            'is_active' => false,
        ]);

        $kelompok = KelompokKkn::factory()->create([
            'periode_id' => $periode->id,
        ]);

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('Penugasan DPL untuk periode tersebut sudah tidak aktif.');

        $this->service->assignPrimaryGroup($dplPeriod, $kelompok);
    }

    public function test_assign_primary_group_throws_when_period_mismatch(): void
    {
        $dosen = Dosen::factory()->create();
        $periodeA = Periode::factory()->create();
        $periodeB = Periode::factory()->create();

        $dplPeriod = DplPeriod::create([
            'dosen_id' => $dosen->id,
            'periode_id' => $periodeA->id,
            'max_kelompok_kkn' => 5,
            'is_active' => true,
        ]);

        $kelompok = KelompokKkn::factory()->create([
            'periode_id' => $periodeB->id,
        ]);

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('Kelompok dan DPL berada pada periode yang berbeda.');

        $this->service->assignPrimaryGroup($dplPeriod, $kelompok);
    }

    public function test_assign_primary_group_throws_when_at_capacity(): void
    {
        $dosen = Dosen::factory()->create();
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();

        $dplPeriod = DplPeriod::create([
            'dosen_id' => $dosen->id,
            'periode_id' => $periode->id,
            'max_kelompok_kkn' => 1,
            'is_active' => true,
        ]);

        // Create one group already assigned to this DPL
        KelompokKkn::factory()->create([
            'periode_id' => $periode->id,
            'location_id' => $lokasi->id,
            'dpl_id' => $dosen->id,
            'dpl_periode_id' => $dplPeriod->id,
        ]);

        // Create another group not yet assigned
        $newGroup = KelompokKkn::factory()->create([
            'periode_id' => $periode->id,
            'location_id' => $lokasi->id,
            'dpl_id' => null,
            'dpl_periode_id' => null,
        ]);

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('DPL sudah mencapai batas maksimum kelompok');

        $this->service->assignPrimaryGroup($dplPeriod, $newGroup);
    }

    public function test_assign_primary_group_assigns_correctly(): void
    {
        $dosen = Dosen::factory()->create();
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();

        $dplPeriod = DplPeriod::create([
            'dosen_id' => $dosen->id,
            'periode_id' => $periode->id,
            'max_kelompok_kkn' => 5,
            'is_active' => true,
        ]);

        $kelompok = KelompokKkn::factory()->create([
            'periode_id' => $periode->id,
            'location_id' => $lokasi->id,
            'dpl_id' => null,
            'dpl_periode_id' => null,
        ]);

        $this->service->assignPrimaryGroup($dplPeriod, $kelompok);

        $kelompok->refresh();

        $this->assertSame($dosen->id, $kelompok->dpl_id);
        $this->assertSame($dplPeriod->id, $kelompok->dpl_periode_id);
    }

    public function test_assign_primary_group_demotes_existing_ketua(): void
    {
        $oldDosen = Dosen::factory()->create();
        $newDosen = Dosen::factory()->create();
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();

        $oldDplPeriod = DplPeriod::create([
            'dosen_id' => $oldDosen->id,
            'periode_id' => $periode->id,
            'max_kelompok_kkn' => 5,
            'is_active' => true,
        ]);

        $newDplPeriod = DplPeriod::create([
            'dosen_id' => $newDosen->id,
            'periode_id' => $periode->id,
            'max_kelompok_kkn' => 5,
            'is_active' => true,
        ]);

        $kelompok = KelompokKkn::factory()->create([
            'periode_id' => $periode->id,
            'location_id' => $lokasi->id,
            'dpl_id' => $oldDosen->id,
            'dpl_periode_id' => $oldDplPeriod->id,
        ]);

        $kelompok->dosen()->attach($oldDosen->id, ['role' => 'Ketua']);

        $this->service->assignPrimaryGroup($newDplPeriod, $kelompok);

        // Old dosen should be demoted to Anggota
        $pivotRole = DB::table('dpl_kelompok')
            ->where('kelompok_kkn_id', $kelompok->id)
            ->where('dosen_id', $oldDosen->id)
            ->value('role');

        $this->assertSame('Anggota', $pivotRole);

        // New dosen should be Ketua
        $newPivotRole = DB::table('dpl_kelompok')
            ->where('kelompok_kkn_id', $kelompok->id)
            ->where('dosen_id', $newDosen->id)
            ->value('role');

        $this->assertSame('Ketua', $newPivotRole);
    }

    public function test_assign_primary_group_succeeds_when_reassigning_same_dpl(): void
    {
        $dosen = Dosen::factory()->create();
        $periode = Periode::factory()->create();
        $lokasi = Lokasi::factory()->create();

        $dplPeriod = DplPeriod::create([
            'dosen_id' => $dosen->id,
            'periode_id' => $periode->id,
            'max_kelompok_kkn' => 1,
            'is_active' => true,
        ]);

        $kelompok = KelompokKkn::factory()->create([
            'periode_id' => $periode->id,
            'location_id' => $lokasi->id,
            'dpl_id' => $dosen->id,
            'dpl_periode_id' => $dplPeriod->id,
        ]);

        // This should not throw even though at capacity, because it's the same assignment
        $this->service->assignPrimaryGroup($dplPeriod, $kelompok);

        $kelompok->refresh();
        $this->assertSame($dosen->id, $kelompok->dpl_id);
    }

    public function test_assign_district_coordinator_throws_when_dpl_not_active(): void
    {
        $dosen = Dosen::factory()->create();
        $periode = Periode::factory()->create();

        $dplPeriod = DplPeriod::create([
            'dosen_id' => $dosen->id,
            'periode_id' => $periode->id,
            'max_kelompok_kkn' => 5,
            'is_active' => false,
        ]);

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('Koordinator wilayah hanya dapat ditetapkan untuk DPL yang aktif.');

        $this->service->assignDistrictCoordinator($dplPeriod, '32.01', 'Test District', 'Test Regency');
    }

    public function test_assign_district_coordinator_creates_assignment(): void
    {
        $dosen = Dosen::factory()->create();
        $periode = Periode::factory()->create();
        $assigner = User::factory()->create();

        $dplPeriod = DplPeriod::create([
            'dosen_id' => $dosen->id,
            'periode_id' => $periode->id,
            'max_kelompok_kkn' => 5,
            'is_active' => true,
        ]);

        $assignment = $this->service->assignDistrictCoordinator(
            $dplPeriod,
            '32.01',
            'Test District',
            'Test Regency',
            $assigner->id,
        );

        $this->assertInstanceOf(DplKecamatanAssignment::class, $assignment);
        $this->assertSame($periode->id, $assignment->periode_id);
        $this->assertSame('32.01', $assignment->kecamatan_id);
        $this->assertSame('Test District', $assignment->district_name);
        $this->assertSame('Test Regency', $assignment->regency_name);
        $this->assertSame($assigner->id, $assignment->assigned_by);
        $this->assertTrue($assignment->is_active);
    }

    public function test_assign_district_coordinator_updates_existing_assignment(): void
    {
        $dosen = Dosen::factory()->create();
        $periode = Periode::factory()->create();
        $firstAssigner = User::factory()->create();
        $secondAssigner = User::factory()->create();

        $dplPeriod = DplPeriod::create([
            'dosen_id' => $dosen->id,
            'periode_id' => $periode->id,
            'max_kelompok_kkn' => 5,
            'is_active' => true,
        ]);

        // Create initial assignment
        DplKecamatanAssignment::create([
            'periode_id' => $periode->id,
            'kecamatan_id' => '32.01',
            'dpl_periode_id' => $dplPeriod->id,
            'dosen_id' => $dosen->id,
            'district_name' => 'Old District',
            'regency_name' => 'Old Regency',
            'assigned_by' => $firstAssigner->id,
            'is_active' => true,
        ]);

        $assignment = $this->service->assignDistrictCoordinator(
            $dplPeriod,
            '32.01',
            'New District',
            'New Regency',
            $secondAssigner->id,
        );

        $this->assertSame('New District', $assignment->district_name);
        $this->assertSame('New Regency', $assignment->regency_name);
        $this->assertSame($secondAssigner->id, $assignment->assigned_by);
    }

    public function test_assign_district_coordinator_without_optional_fields(): void
    {
        $dosen = Dosen::factory()->create();
        $periode = Periode::factory()->create();

        $dplPeriod = DplPeriod::create([
            'dosen_id' => $dosen->id,
            'periode_id' => $periode->id,
            'max_kelompok_kkn' => 5,
            'is_active' => true,
        ]);

        $assignment = $this->service->assignDistrictCoordinator(
            $dplPeriod,
            '32.01',
            'Test District',
            null,
            null,
        );

        $this->assertNull($assignment->regency_name);
        $this->assertNull($assignment->assigned_by);
    }

    public function test_max_kelompok_kkn_can_be_zero(): void
    {
        $dosen = Dosen::factory()->create();
        $periode = Periode::factory()->create();
        $user = User::factory()->create();

        $this->provisioningMock
            ->shouldReceive('ensureDplAccount')
            ->once()
            ->andReturn([
                'user' => $user,
                'created' => true,
                'activated' => true,
                'temp_password' => 'temppass',
            ]);

        $this->eligibilityMock
            ->shouldReceive('isQualifiedForDpl')
            ->once()
            ->andReturn(['eligible' => true]);

        $result = $this->service->activateForPeriod($dosen, $periode, 0);

        $this->assertSame(0, $result['assignment']->max_kelompok_kkn);
        $this->assertTrue($result['assignment']->is_active);
    }
}
