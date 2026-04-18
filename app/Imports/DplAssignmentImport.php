<?php

declare(strict_types=1);

namespace App\Imports;

use App\Models\KKN\Dosen;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Periode;
use App\Services\DplAssignmentService;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class DplAssignmentImport implements ToCollection, WithHeadingRow
{
    public int $activatedCount = 0;

    public int $groupAssignmentCount = 0;

    public int $districtCoordinatorCount = 0;

    public int $provisionedAccountCount = 0;

    public int $skippedCount = 0;

    /** @var array<int, string> */
    public array $errors = [];

    public function __construct(
        private DplAssignmentService $assignmentService,
    ) {}

    public function collection(Collection $rows): void
    {
        // 1. Pre-fetch NIPs to bulk load Dosen to avoid O(N) queries
        $nips = $rows->pluck('nip')->filter()->unique()->toArray();
        $lecturers = Dosen::whereIn('nip', $nips)->get()->keyBy('nip');

        // 2. Pre-fetch Periods that might be needed
        $periodIds = $rows->pluck('periode_id')->filter()->unique()->toArray();
        $periodsById = Periode::whereIn('id', $periodIds)->get()->keyBy('id');

        $periodNames = $rows->pluck('periode')->filter()->unique()->toArray();
        $periodsByName = Periode::whereIn('name', $periodNames)
            ->orWhereIn('periode', $periodNames)
            ->get();

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;
            $nip = $this->value($row, ['nip']);

            if (! filled($nip)) {
                $this->skippedCount++;

                continue;
            }

            // Use pre-fetched lecturer
            $dosen = $lecturers->get($nip);
            if (! $dosen) {
                $this->errors[] = "Baris {$rowNumber}: NIP {$nip} tidak ditemukan pada master dosen lokal.";

                continue;
            }

            // Resolve period using pre-fetched data where possible
            $period = $this->resolvePeriodFromFetched($row, $periodsById, $periodsByName);
            if (! $period) {
                $this->errors[] = "Baris {$rowNumber}: periode tidak dikenali.";

                continue;
            }

            $maxGroups = (int) ($this->value($row, ['max_groups', 'maks_kelompok']) ?? 5);
            $maxGroups = max(1, min($maxGroups, 20));

            try {
                // Service operations are already transactional-safe
                $activation = $this->assignmentService->activateForPeriod($dosen, $period, $maxGroups);
                $dplPeriod = $activation['assignment'];

                if ($activation['provisioning']['created']) {
                    $this->provisionedAccountCount++;
                }

                $this->activatedCount++;

                $groupCode = $this->value($row, ['kode_kelompok', 'group_code']);
                if (filled($groupCode)) {
                    $group = KelompokKkn::query()
                        ->where('periode_id', $period->id)
                        ->where('code', $groupCode)
                        ->first();

                    if (! $group) {
                        $this->errors[] = "Baris {$rowNumber}: kelompok {$groupCode} tidak ditemukan pada periode terkait.";
                    } else {
                        $this->assignmentService->assignPrimaryGroup($dplPeriod, $group);
                        $this->groupAssignmentCount++;
                    }
                }

                [$districtId, $districtName, $regencyName] = $this->resolveDistrict($row);
                if ($districtId && $districtName) {
                    $this->assignmentService->assignDistrictCoordinator(
                        $dplPeriod,
                        $districtId,
                        $districtName,
                        $regencyName,
                        null,
                    );
                    $this->districtCoordinatorCount++;
                }
            } catch (\Throwable $exception) {
                $this->errors[] = "Baris {$rowNumber}: {$exception->getMessage()}";
                \Log::error("Import Error at row {$rowNumber}", ['error' => $exception->getMessage()]);
            }
        }
    }

    private function resolvePeriodFromFetched(Collection $row, Collection $byId, Collection $byName): ?Periode
    {
        $periodId = $this->value($row, ['periode_id', 'periode_id']);
        if (filled($periodId) && is_numeric($periodId)) {
            return $byId->get((int) $periodId);
        }

        $periodName = $this->value($row, ['periode', 'period_name', 'nama_periode']);
        if (filled($periodName)) {
            return $byName->first(fn ($p) => $p->name === $periodName || $p->periode === $periodName);
        }

        return null;
    }

    private function resolvePeriod(Collection $row): ?Periode
    {
        $periodId = $this->value($row, ['periode_id', 'periode_id']);
        if (filled($periodId) && is_numeric($periodId)) {
            return Periode::query()->find((int) $periodId);
        }

        $periodName = $this->value($row, ['periode', 'period_name', 'nama_periode']);
        if (filled($periodName)) {
            return Periode::query()
                ->where('name', $periodName)
                ->orWhere('periode', $periodName)
                ->first();
        }

        return null;
    }

    /**
     * @return array{0:?string,1:?string,2:?string}
     */
    private function resolveDistrict(Collection $row): array
    {
        $districtId = $this->value($row, ['district_id', 'kode_kecamatan']);
        if (filled($districtId)) {
            $location = Lokasi::query()
                ->where('district_id', $districtId)
                ->select('district_id', 'district_name', 'regency_name')
                ->first();

            return [
                $location?->district_id ? (string) $location->district_id : null,
                $location?->district_name,
                $location?->regency_name,
            ];
        }

        $districtName = $this->value($row, ['district_name', 'kecamatan']);
        if (! filled($districtName)) {
            return [null, null, null];
        }

        $location = Lokasi::query()
            ->where('district_name', $districtName)
            ->select('district_id', 'district_name', 'regency_name')
            ->first();

        return [
            $location?->district_id ? (string) $location->district_id : null,
            $location?->district_name,
            $location?->regency_name,
        ];
    }

    private function value(Collection $row, array $keys): ?string
    {
        foreach ($keys as $key) {
            $value = $row->get($key);

            if ($value === null) {
                continue;
            }

            $normalized = trim((string) $value);
            if ($normalized !== '') {
                return $normalized;
            }
        }

        return null;
    }
}
