<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\Dosen;
use App\Models\KKN\DplKecamatanAssignment;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Periode;
use App\Models\User;
use DomainException;
use Illuminate\Support\Facades\DB;

class DplAssignmentService
{
    public function __construct(
        private DplProvisioningService $provisioningService,
        private DplEligibilityService $eligibilityService,
    ) {}

    /**
     * @return array{assignment: DplPeriod, provisioning: array{user: User, created: bool, activated: bool, temp_password: ?string}}
     */
    public function activateForPeriod(Dosen $dosen, Periode $period, int $maxGroups): array
    {
        // PRD FR-03: Strict Eligibility Guard
        $qualification = $this->eligibilityService->isQualifiedForDpl($dosen, $period->id);
        if (! $qualification['eligible']) {
            throw new DomainException($qualification['reason']);
        }

        $provisioning = $this->provisioningService->ensureDplAccount($dosen);

        $assignment = DplPeriod::updateOrCreate(
            [
                'dosen_id' => $dosen->id,
                'periode_id' => $period->id,
            ],
            [
                'max_kelompok_kkn' => $maxGroups,
                'is_active' => true,
            ],
        );

        return [
            'assignment' => $assignment,
            'provisioning' => $provisioning,
        ];
    }

    public function assignPrimaryGroup(DplPeriod $dplPeriod, KelompokKkn $group): void
    {
        if (! $dplPeriod->is_active) {
            throw new DomainException('Penugasan DPL untuk periode tersebut sudah tidak aktif.');
        }

        if ($group->periode_id !== $dplPeriod->periode_id) {
            throw new \Exception('Kelompok dan DPL berada pada periode yang berbeda.');
        }

        $isCurrentAssignment = $group->dpl_periode_id === $dplPeriod->id;
        if (! $isCurrentAssignment && ! $dplPeriod->hasCapacity()) {
            throw new DomainException('DPL sudah mencapai batas maksimum kelompok untuk periode ini.');
        }

        DB::transaction(function () use ($dplPeriod, $group) {
            $existingKetua = $group->dosen()->wherePivot('role', 'Ketua')->first();
            if ($existingKetua && $existingKetua->id !== $dplPeriod->dosen_id) {
                // Downgrade existing ketua to ordinary member if they are different
                $group->dosen()->updateExistingPivot($existingKetua->id, ['role' => 'Anggota']);
            }

            // Sync flat columns for simple reporting/queries
            $group->update([
                'dpl_id' => $dplPeriod->dosen_id,
                'dpl_periode_id' => $dplPeriod->id,
            ]);

            // Sync pivot table for multiple DPL support
            $group->dosen()->syncWithoutDetaching([
                $dplPeriod->dosen_id => ['role' => 'Ketua'],
            ]);
        });
    }

    public function assignDistrictCoordinator(
        DplPeriod $dplPeriod,
        string $districtId,
        string $districtName,
        ?string $regencyName,
        ?int $assignedBy = null,
    ): DplKecamatanAssignment {
        if (! $dplPeriod->is_active) {
            throw new DomainException('Koordinator wilayah hanya dapat ditetapkan untuk DPL yang aktif.');
        }

        return DplKecamatanAssignment::updateOrCreate(
            [
                'periode_id' => $dplPeriod->periode_id,
                'kecamatan_id' => $districtId,
            ],
            [
                'dpl_periode_id' => $dplPeriod->id,
                'dosen_id' => $dplPeriod->dosen_id,
                'district_name' => $districtName,
                'regency_name' => $regencyName,
                'assigned_by' => $assignedBy,
                'is_active' => true,
            ],
        );
    }
}
