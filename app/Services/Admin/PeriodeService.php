<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\KKN\JenisKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Periode;
use App\Services\KKN\PeriodeGovernanceService;
use App\Services\RedisCacheService;
use DomainException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PeriodeService
{
    /**
     * Prepare data for store/update, including governance logic and name generation.
     */
    public function prepareData(array $data, ?int $excludeId = null): array
    {
        $jenisKkn = ! empty($data['jenis_kkn_id'])
            ? JenisKkn::query()->find($data['jenis_kkn_id'])
            : null;

        $governance = PeriodeGovernanceService::blueprint(
            $data['program_type'] ?? $jenisKkn?->code,
            $data['program_subtype'] ?? null,
            $data['jenis'] ?? $jenisKkn?->code,
            $jenisKkn,
        );

        $data['jenis'] = $governance['jenis_value'];
        $data['program_type'] = $governance['program_type'];
        $data['program_subtype'] = $governance['program_subtype'];
        $data['registration_mode'] = $governance['registration_mode'];
        $data['placement_mode'] = $governance['placement_mode'];

        // Fallback default for technical fields
        $data = array_merge([
            'program_type' => 'reguler',
            'registration_mode' => 'open',
            'placement_mode' => 'manual_admin',
        ], $data);

        // Generate name if empty
        if (empty($data['name'])) {
            $programLabel = $jenisKkn?->name ?? $data['jenis'] ?? $data['program_type'] ?? 'KKN';
            $data['name'] = "Periode {$data['periode']} - ".strtoupper((string) $programLabel);
        }

        // Overlap Check
        $startDate = Carbon::parse($data['start_date'])->format('Y-m-d');
        $endDate = Carbon::parse($data['end_date'])->format('Y-m-d');
        $overlap = $this->checkDateOverlap(
            $startDate,
            $endDate,
            isset($data['jenis_kkn_id']) ? (int) $data['jenis_kkn_id'] : null,
            $excludeId
        );

        if ($overlap) {
            throw new DomainException("Tanggal overlap dengan periode '{$overlap->name}' ({$overlap->start_date->format('d M Y')} - {$overlap->end_date->format('d M Y')})");
        }

        return $data;
    }

    public function store(array $data): Periode
    {
        $preparedData = $this->prepareData($data);

        return DB::transaction(function () use ($preparedData) {
            if (! empty($preparedData['is_active'])) {
                Periode::where('is_active', true)->update(['is_active' => false]);
            }

            $periode = Periode::create($preparedData);
            $this->afterChange();

            return $periode;
        });
    }

    public function update(Periode $periode, array $data): bool
    {
        $preparedData = $this->prepareData($data, $periode->id);

        return DB::transaction(function () use ($periode, $preparedData) {
            if (! empty($preparedData['is_active'])) {
                Periode::where('id', '!=', $periode->id)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);
            }

            $success = $periode->update($preparedData);
            $this->afterChange();

            return $success;
        });
    }

    public function duplicate(Periode $periode): Periode
    {
        // 1. Duplicate the period itself first
        $newPeriod = DB::transaction(function () use ($periode) {
            $newPeriod = $periode->replicate();
            $newPeriod->name = $this->generateCopyName($periode->name);
            $newPeriod->is_active = false;
            $newPeriod->save();

            return $newPeriod;
        });

        // 2. Duplicate groups in chunks to maintain stability and prevent memory overflow
        $periode->kelompok()->with('slotTerkunci')->chunk(50, function ($groups) use ($newPeriod) {
            foreach ($groups as $group) {
                DB::transaction(function () use ($group, $newPeriod) {
                    $newGroup = $group->replicate();
                    $newGroup->period_id = $newPeriod->id;
                    $newGroup->dpl_id = null;
                    $newGroup->dpl_period_id = null;
                    $newGroup->status = 'draft';
                    $newGroup->code = $this->generateUniqueGroupCode();
                    $newGroup->token = $this->generateUniqueGroupToken();
                    $newGroup->save();

                    // Duplicate slots if any
                    foreach ($group->slotTerkunci as $slot) {
                        $newSlot = $slot->replicate();
                        $newSlot->kelompok_id = $newGroup->id;
                        $newSlot->save();
                    }
                });
            }
        });

        $this->afterChange();

        return $newPeriod;
    }

    public function delete(Periode $periode): bool
    {
        $periode->loadCount(['kelompok', 'peserta', 'dplPeriods']);

        if (! $this->canDelete($periode)) {
            throw new DomainException($this->getDeleteBlockerReason($periode));
        }

        $success = $periode->delete();
        $this->afterChange();

        return $success;
    }

    public function canDelete(Periode $period): bool
    {
        return ! $period->is_active
            && (int) ($period->kelompok_count ?? 0) === 0
            && (int) ($period->peserta_count ?? 0) === 0
            && (int) ($period->dpl_periods_count ?? 0) === 0;
    }

    public function getDeleteBlockerReason(Periode $period): ?string
    {
        if ($period->is_active) {
            return 'Periode aktif tidak dapat dihapus. Nonaktifkan atau aktifkan periode lain terlebih dahulu.';
        }

        if (
            (int) ($period->kelompok_count ?? 0) > 0 ||
            (int) ($period->peserta_count ?? 0) > 0 ||
            (int) ($period->dpl_periods_count ?? 0) > 0
        ) {
            return 'Periode tidak dapat dihapus karena masih memiliki kelompok, peserta, atau penugasan DPL.';
        }

        return null;
    }

    private function generateCopyName(string $name): string
    {
        $baseName = preg_replace('/\s+\(Copy(?: \d+)?\)$/', '', $name) ?: $name;
        $candidate = $baseName.' (Copy)';
        $suffix = 2;

        while (Periode::withTrashed()->where('name', $candidate)->exists()) {
            $candidate = sprintf('%s (Copy %d)', $baseName, $suffix);
            $suffix++;
        }

        return $candidate;
    }

    private function generateUniqueGroupCode(): string
    {
        do {
            $code = 'KKN-'.strtoupper(Str::random(6));
        } while (KelompokKkn::withTrashed()->where('code', $code)->exists());

        return $code;
    }

    private function generateUniqueGroupToken(): string
    {
        do {
            $token = strtoupper(Str::random(8));
        } while (KelompokKkn::withTrashed()->where('token', $token)->exists());

        return $token;
    }

    public function checkDateOverlap(string $startDate, string $endDate, ?int $jenisKknId = null, ?int $excludeId = null): ?Periode
    {
        $query = Periode::where(function ($q) use ($startDate, $endDate) {
            $q->whereBetween('start_date', [$startDate, $endDate])
                ->orWhereBetween('end_date', [$startDate, $endDate])
                ->orWhere(function ($q2) use ($startDate, $endDate) {
                    $q2->where('start_date', '<=', $startDate)
                        ->where('end_date', '>=', $endDate);
                });
        });

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        if ($jenisKknId) {
            $query->where('jenis_kkn_id', $jenisKknId);
        }

        return $query->first();
    }

    private function afterChange(): void
    {
        Periode::flushContextCache();
        if (class_exists(RedisCacheService::class)) {
            RedisCacheService::invalidateMasterData();
        }
    }
}
