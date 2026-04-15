<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\KKN\Dosen;
use App\Models\KKN\DplKecamatanAssignment;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\LogAudit;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Periode;
use App\Notifications\KKN\DplAssignedToGroupNotification;
use App\Notifications\KKN\DplRemovedFromPeriodNotification;
use App\Services\DplAssignmentService as BaseDplAssignmentService;
use DomainException;
use Illuminate\Support\Facades\DB;

class DplAssignmentService
{
    public function __construct(
        private BaseDplAssignmentService $baseService
    ) {}

    public function activateForPeriod(Dosen $dosen, Periode $period, int $maxGroups, ?int $adminId = null): array
    {
        $result = $this->baseService->activateForPeriod($dosen, $period, $maxGroups);

        $this->logAudit(
            'assign_dpl_period',
            "DPL {$dosen->nama} (NIP: {$dosen->nip}) diaktifkan pada periode {$period->name}",
            [
                'dosen_id' => $dosen->id,
                'dosen_nama' => $dosen->nama,
                'period_id' => $period->id,
                'period_name' => $period->name,
                'max_groups' => $maxGroups,
                'account_created' => $result['provisioning']['created'] ?? false,
            ],
            $adminId
        );

        return $result;
    }

    public function assignToGroup(DplPeriod $dplPeriod, KelompokKkn $group, ?int $adminId = null): void
    {
        $this->baseService->assignPrimaryGroup($dplPeriod, $group);

        $this->logAudit(
            'assign_group_to_dpl',
            "Kelompok {$group->nama_kelompok} ({$group->code}) ditugaskan kepada DPL {$dplPeriod->dosen->nama}",
            [
                'group_id' => $group->id,
                'group_code' => $group->code,
                'group_name' => $group->nama_kelompok,
                'dpl_id' => $dplPeriod->dosen_id,
                'dpl_periode_id' => $dplPeriod->id,
            ],
            $adminId
        );

        // Notify DPL
        $dplUser = $dplPeriod->dosen?->user;
        if ($dplUser) {
            $group->load(['lokasi', 'periode']);
            $locationName = $group->lokasi
                ? trim(($group->lokasi->district_name ?? '').', '.($group->lokasi->regency_name ?? ''), ', ')
                : null;

            $dplUser->notify(new DplAssignedToGroupNotification(
                $group->nama_kelompok,
                $group->periode?->name ?? 'KKN',
                $locationName ?: null,
            ));
        }
    }

    public function assignDistrictCoordinator(
        Dosen $dosen,
        Periode $period,
        string $districtId,
        int $maxGroups = 5,
        ?int $adminId = null
    ): array {
        $district = Lokasi::query()
            ->where('district_id', $districtId)
            ->select('district_id', 'district_name', 'regency_name')
            ->first();

        if (! $district) {
            throw new DomainException('Kecamatan tidak ditemukan pada master lokasi.');
        }

        // Check if already active for period
        $dplPeriod = DplPeriod::where('dosen_id', $dosen->id)
            ->where('period_id', $period->id)
            ->first();

        $activation = $dplPeriod
            ? ['assignment' => $dplPeriod, 'provisioning' => ['temp_password' => null]]
            : $this->baseService->activateForPeriod($dosen, $period, $maxGroups);

        $this->baseService->assignDistrictCoordinator(
            $activation['assignment'],
            (string) $district->district_id,
            $district->district_name,
            $district->regency_name,
            $adminId,
        );

        $this->logAudit(
            'assign_district_coordinator',
            "DPL {$dosen->nama} (NIP: {$dosen->nip}) ditetapkan sebagai koordinator kecamatan {$district->district_name}",
            [
                'dosen_id' => $dosen->id,
                'dosen_nama' => $dosen->nama,
                'period_id' => $period->id,
                'period_name' => $period->name,
                'district_id' => $district->district_id,
                'district_name' => $district->district_name,
                'regency_name' => $district->regency_name,
            ],
            $adminId
        );

        return $activation;
    }

    public function removeDistrictCoordinator(DplKecamatanAssignment $assignment, ?int $adminId = null): void
    {
        $assignment->update(['is_active' => false]);

        $this->logAudit(
            'remove_district_coordinator',
            "Koordinator DPL {$assignment->dosen->nama} untuk kecamatan {$assignment->district_name} dinonaktifkan",
            [
                'dosen_id' => $assignment->dosen_id,
                'district_id' => $assignment->district_id,
                'district_name' => $assignment->district_name,
            ],
            $adminId
        );
    }

    public function removeDplFromPeriod(DplPeriod $dplPeriod, ?int $adminId = null): void
    {
        $assignedGroupsCount = $dplPeriod->kelompok()->count();
        if ($assignedGroupsCount > 0) {
            throw new DomainException("Tidak dapat menghapus DPL yang masih memiliki {$assignedGroupsCount} kelompok aktif. Lepaskan kelompok terlebih dahulu.");
        }

        DB::transaction(function () use ($dplPeriod) {
            // Clear any groups that still reference this DPL period
            KelompokKkn::where('dpl_period_id', $dplPeriod->id)
                ->update([
                    'dpl_period_id' => null,
                    'dpl_id' => null,
                ]);

            // Detach from pivot table
            $dplPeriod->kelompok()->detach();

            // Mark as inactive
            $dplPeriod->update(['is_active' => false]);
        });

        // Notify DPL user
        $dplUser = $dplPeriod->dosen?->user;
        if ($dplUser) {
            $dplUser->notify(new DplRemovedFromPeriodNotification(
                $dplPeriod->periode->name ?? 'KKN',
                'Penugasan DPL telah dicabut oleh admin.',
            ));
        }

        $this->logAudit(
            'remove_dpl_period',
            "DPL {$dplPeriod->dosen->nama} dihapus dari periode {$dplPeriod->periode->name}",
            [
                'dosen_id' => $dplPeriod->dosen_id,
                'period_id' => $dplPeriod->period_id,
            ],
            $adminId
        );
    }

    private function logAudit(string $action, string $description, ?array $newValues = null, ?int $userId = null): void
    {
        LogAudit::create([
            'user_id' => $userId ?? auth()->id(),
            'action' => $action,
            'description' => $description,
            'model_type' => 'DplPeriod',
            'severity' => 'info',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'new_values' => $newValues,
        ]);
    }
}
