<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\Periode;
use App\Models\KKN\SystemSetting;
use App\Services\KKN\KknRequirementService;
use App\Services\KKN\PeriodeGovernanceService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class RegistrationPortalService
{
    private const VERSION_CACHE_KEY = 'registration_portal.snapshot_version';

    private const DEFAULT_SNAPSHOT_TTL_SECONDS = 3;

    public function __construct(
        private readonly GroupSelectionService $groupSelectionService,
        private readonly KknRequirementService $kknRequirementService,
    ) {}

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function activePeriodsSnapshot(string $today): Collection
    {
        $ttl = max(1, (int) SystemSetting::get('registration_snapshot_cache_seconds', self::DEFAULT_SNAPSHOT_TTL_SECONDS));
        $cacheKey = $this->snapshotCacheKey($today);
        $store = Cache::store($this->snapshotStore());

        $snapshot = $store->remember($cacheKey, now()->addSeconds($ttl), function () use ($today) {
            return Periode::query()
                ->select([
                    'id',
                    'name',
                    'jenis',
                    'program_type',
                    'program_subtype',
                    'registration_mode',
                    'placement_mode',
                    'registration_start',
                    'registration_end',
                ])
                ->where('is_active', true)
                ->whereDate('registration_start', '<=', $today)
                ->whereDate('registration_end', '>=', $today)
                ->with([
                    'kelompok' => function ($query) {
                        $query->select(['id', 'periode_id', 'location_id', 'nama_kelompok', 'capacity', 'status'])
                            ->where('status', 'active')
                            ->with([
                                'lokasi:id,village_name,district_name,regency_name',
                            ])
                            ->withCount([
                                'peserta' => function ($participantQuery) {
                                    $participantQuery->whereIn('status', GroupSelectionService::activeRegistrationStatuses());
                                },
                                'peserta as male_member_count' => function ($participantQuery) {
                                    $participantQuery->whereIn('status', GroupSelectionService::activeRegistrationStatuses())
                                        ->whereHas('mahasiswa', function ($studentQuery) {
                                            $studentQuery->where('gender', 'L');
                                        });
                                },
                                'peserta as female_member_count' => function ($participantQuery) {
                                    $participantQuery->whereIn('status', GroupSelectionService::activeRegistrationStatuses())
                                        ->whereHas('mahasiswa', function ($studentQuery) {
                                            $studentQuery->where('gender', 'P');
                                        });
                                },
                            ])
                            ->orderBy('nama_kelompok');
                    },
                ])
                ->orderByDesc('registration_start')
                ->get()
                ->map(function (Periode $period) {
                    $jenisKkn = $period->jenisKkn;
                    $governance = $jenisKkn ? PeriodeGovernanceService::blueprintFromJenisKkn($jenisKkn) : [];
                    $guide = $this->kknRequirementService->describe($period);

                    return [
                        'id' => $period->id,
                        'nama' => $period->name,
                        'jenis' => $jenisKkn?->name ?? '-',
                        'jenis_code' => $jenisKkn?->code ?? 'REGULER',
                        'program_type' => $governance['program_type'] ?? 'reguler',
                        'program_subtype' => $governance['program_subtype'] ?? null,
                        'registration_mode' => $jenisKkn?->registration_mode ?? 'open',
                        'placement_mode' => $jenisKkn?->placement_mode ?? 'manual_admin',
                        'program_type_label' => $governance['program_type_label'] ?? 'Reguler',
                        'program_subtype_label' => $governance['program_subtype_label'] ?? '-',
                        'registration_mode_label' => $jenisKkn?->registrationModeLabel() ?? 'Terbuka',
                        'placement_mode_label' => $jenisKkn?->placementModeLabel() ?? 'Manual',
                        'self_service_enabled' => $jenisKkn
                            ? $jenisKkn->registration_mode === Periode::REGISTRATION_MODE_OPEN
                                && $jenisKkn->placement_mode === Periode::PLACEMENT_MODE_AUTOMATIC_AFTER_APPROVAL
                            : false,
                        'guide' => $guide,
                        'registration_start' => optional($period->registration_start)->format('Y-m-d'),
                        'registration_end' => optional($period->registration_end)->format('Y-m-d'),
                        'kelompok' => $period->kelompok->map(function ($group) {
                            $maleQuota = $this->groupSelectionService->maleQuotaRange((int) $group->capacity);
                            $maleMemberCount = (int) ($group->male_member_count ?? 0);

                            return [
                                'id' => $group->id,
                                'nama_kelompok' => $group->nama_kelompok,
                                'capacity' => (int) $group->capacity,
                                'peserta_count' => (int) ($group->peserta_count ?? 0),
                                'remaining_seats' => max((int) $group->capacity - (int) ($group->peserta_count ?? 0), 0),
                                'male_member_count' => $maleMemberCount,
                                'female_member_count' => (int) ($group->female_member_count ?? 0),
                                'male_min_required' => $maleQuota['minimum'],
                                'male_target_maximum' => $maleQuota['maximum'],
                                'requires_more_male_members' => $maleMemberCount < $maleQuota['minimum'],
                                'male_target_reached' => $maleMemberCount >= $maleQuota['maximum'],
                                'male_target_exceeded' => $maleMemberCount > $maleQuota['maximum'],
                                'male_min_percentage' => $this->groupSelectionService->maleMinimumPercent(),
                                'male_target_percentage' => $this->groupSelectionService->maleTargetPercent(),
                                'reserved_male_slots' => max($maleQuota['minimum'] - $maleMemberCount, 0),
                                'lokasi' => $group->lokasi ? [
                                    'id' => $group->lokasi->id,
                                    'village_name' => $group->lokasi->village_name,
                                    'district_name' => $group->lokasi->district_name,
                                    'regency_name' => $group->lokasi->regency_name,
                                    'full_name' => $group->lokasi->full_name,
                                ] : null,
                            ];
                        })->values()->all(),
                    ];
                })
                ->values()
                ->all();
        });

        return collect($snapshot);
    }

    public function invalidateActivePeriodsSnapshot(): void
    {
        $store = Cache::store($this->snapshotStore());

        if (! $store->add(self::VERSION_CACHE_KEY, 1, now()->addDays(30))) {
            $store->increment(self::VERSION_CACHE_KEY);
        }
    }

    private function snapshotCacheKey(string $today): string
    {
        $version = (int) Cache::store($this->snapshotStore())->get(self::VERSION_CACHE_KEY, 1);

        return "registration_portal.active_periods.{$today}.v{$version}";
    }

    private function snapshotStore(): string
    {
        return (string) config('cache.registration_snapshot_store', config('cache.default'));
    }
}
