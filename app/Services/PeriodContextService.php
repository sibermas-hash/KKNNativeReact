<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\Periode;
use App\Services\KKN\PeriodeGovernanceService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Session;

class PeriodContextService
{
    private const CACHE_PREFIX = 'period_context:';

    private const SESSION_KEY = 'active_periode_id';

    private const SESSION_DATA_KEY = 'active_period_data';

    /**
     * Set the active period for the current user session.
     */
    public function setActivePeriod(int $periodId): void
    {
        $period = Periode::with(['tahunAkademik', 'jenisKkn'])->findOrFail($periodId);

        Session::put(self::SESSION_KEY, $periodId);
        Session::put(self::SESSION_DATA_KEY, $this->serializePeriod($period));

        // Cache for quick access per user
        if (auth()->check()) {
            Cache::put(self::CACHE_PREFIX.auth()->id(), $periodId, now()->addHours(24));
        }
    }

    /**
     * Get the active period ID from session.
     */
    public function getActivePeriodId(): ?int
    {
        return Session::get(self::SESSION_KEY);
    }

    /**
     * Get the active period data array from session.
     */
    public function getActivePeriodData(): ?array
    {
        $data = Session::get(self::SESSION_DATA_KEY);

        if ($data) {
            return $data;
        }

        $period = $this->getActivePeriod();

        if (! $period) {
            return null;
        }

        $data = $this->serializePeriod($period);

        if (! Session::has(self::SESSION_KEY)) {
            Session::put(self::SESSION_KEY, $period->id);
        }

        Session::put(self::SESSION_DATA_KEY, $data);

        return $data;
    }

    /**
     * Get the active period model from session or system default.
     * Optimized with Cache to reduce database hits on the hot path.
     */
    public function getActivePeriod(): ?Periode
    {
        $sessionPeriodId = $this->getActivePeriodId();

        if ($sessionPeriodId) {
            $sessionPeriod = Cache::remember("period_model_{$sessionPeriodId}", 3600, function () use ($sessionPeriodId) {
                return Periode::with(['tahunAkademik', 'jenisKkn'])->find($sessionPeriodId);
            });

            if ($sessionPeriod) {
                return $sessionPeriod;
            }

            Session::forget([self::SESSION_KEY, self::SESSION_DATA_KEY]);
            Cache::forget("period_model_{$sessionPeriodId}");
        }

        $defaultPeriodId = $this->getDefaultPeriodId();

        if (! $defaultPeriodId) {
            return null;
        }

        return Cache::remember("period_model_{$defaultPeriodId}", 3600, function () use ($defaultPeriodId) {
            return Periode::with(['tahunAkademik', 'jenisKkn'])->find($defaultPeriodId);
        });
    }

    /**
     * Get the default period ID (the system-wide active period).
     */
    public function getDefaultPeriodId(): ?int
    {
        return Cache::remember('default_periode_id', 3600, function () {
            return Periode::where('is_active', true)
                ->orderBy('periode', 'desc')
                ->value('id');
        });
    }

    /**
     * Get all available periods grouped by period number for the period selector.
     */
    public function getAvailablePeriods(): array
    {
        return Cache::remember('available_periods', 3600, function () {
            return Periode::with(['tahunAkademik', 'jenisKkn'])
                ->orderBy('periode', 'desc')
                ->orderBy('jenis')
                ->get()
                ->groupBy('periode')
                ->map(function ($periods) {
                    return $periods->map(fn ($period) => $this->serializePeriod($period));
                })
                ->toArray();
        });
    }

    /**
     * Clear the active period from session and cache.
     */
    public function clear(): void
    {
        Session::forget([self::SESSION_KEY, self::SESSION_DATA_KEY]);
        if (auth()->check()) {
            Cache::forget(self::CACHE_PREFIX.auth()->id());
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function serializePeriod(Periode $period): array
    {
        $jenisKkn = $period->jenisKkn;

        return [
            'id' => $period->id,
            'periode' => $period->periode,
            'angkatan' => $period->periode,
            'jenis' => $jenisKkn?->name ?? '-',
            'jenis_code' => $jenisKkn?->code ?? 'REGULER',
            'program_type' => $jenisKkn ? PeriodeGovernanceService::blueprintFromJenisKkn($jenisKkn)['program_type'] : null,
            'program_subtype' => null,
            'registration_mode' => $jenisKkn?->registration_mode ?? 'open',
            'placement_mode' => $jenisKkn?->placement_mode ?? 'manual_admin',
            'name' => $period->name,
            'academic_year' => $period->tahunAkademik?->year ?? null,
            'is_active' => $period->is_active,
            'current_phase' => $period->current_phase ?? 'upcoming',
        ];
    }
}
