<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\Dosen;
use App\Models\KKN\DplKecamatanAssignment;
use App\Models\KKN\KelompokKkn;
use Illuminate\Support\Collection;

class DplScopeService
{
    public function assignedGroupIds(Dosen $dosen): Collection
    {
        return $dosen->kelompokKkn()->pluck('kelompok_kkn.id');
    }

    public function coordinatorAssignments(Dosen $dosen): Collection
    {
        return DplKecamatanAssignment::query()
            ->where('dosen_id', $dosen->id)
            ->where('is_active', true)
            ->get();
    }

    public function coordinatorAreaSummaries(Dosen $dosen): Collection
    {
        return $this->coordinatorAssignments($dosen)->map(function (DplKecamatanAssignment $assignment) {
            $groups = KelompokKkn::query()
                ->where('periode_id', $assignment->periode_id)
                ->whereHas('lokasi', function ($query) use ($assignment) {
                    $query->where('district_id', $assignment->district_id);
                })
                ->with(['periode', 'lokasi'])
                ->withCount([
                    'peserta' => fn ($query) => $query->where('status', 'approved'),
                ])
                ->get();

            return [
                'id' => $assignment->id,
                'district_id' => $assignment->district_id,
                'district_name' => $assignment->district_name,
                'regency_name' => $assignment->regency_name,
                'period_name' => $assignment->periode?->name ?? '-',
                'groups_count' => $groups->count(),
                'villages_count' => $groups->pluck('lokasi.village_name')->filter()->unique()->count(),
                'students_count' => (int) $groups->sum('peserta_count'),
            ];
        })->values();
    }
}
