<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Http\Resources\Api\V1\PeriodeResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PeriodContextResource extends JsonResource
{
    public function __construct($resource)
    {
        parent::__construct($resource);
    }

    public function toArray(Request $request): array
    {
        return [
            'active_period' => $this->resource['active_period'] ? new PeriodeResource($this->resource['active_period']) : null,
            'available_periods' => $this->resource['available_periods'] ?? [],
            'current_phase' => $this->resource['current_phase'] ?? 'upcoming',
            'phase_label' => $this->getPhaseLabel($this->resource['current_phase'] ?? 'upcoming'),
        ];
    }

    private function getPhaseLabel(string $phase): string
    {
        return match ($phase) {
            'upcoming' => 'Pra-Pendaftaran',
            'registration' => 'Masa Pendaftaran',
            'placement' => 'Seleksi & Plotting',
            'execution' => 'Pelaksanaan KKN',
            'grading' => 'Masa Penilaian',
            'finished' => 'KKN Selesai',
            default => 'Tidak Diketahui',
        };
    }
}
