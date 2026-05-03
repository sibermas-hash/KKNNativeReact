<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PeriodContextResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'active_period' => $this['active_period'] ? new PeriodeResource($this['active_period']) : null,
            'available_periods' => PeriodeResource::collection($this['available_periods'] ?? collect()),
            'current_phase' => $this['current_phase'] ?? 'upcoming',
            'phase_label' => $this->getPhaseLabel($this['current_phase'] ?? 'upcoming'),
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
