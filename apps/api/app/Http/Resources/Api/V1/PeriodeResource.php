<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PeriodeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'academic_year_id' => $this->academic_year_id,
            'jenis_kkn_id' => $this->jenis_kkn_id,
            'periode' => $this->periode,
            'name' => $this->name,
            'theme' => $this->theme,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'registration_start' => $this->registration_start?->toDateString(),
            'registration_end' => $this->registration_end?->toDateString(),
            'grading_start' => $this->grading_start?->toDateString(),
            'grading_end' => $this->grading_end?->toDateString(),
            'kuota' => $this->kuota,
            'is_active' => $this->is_active,
            'current_phase' => $this->current_phase,
            'phase_label' => $this->getPhaseLabel($this->current_phase),
            'is_locked' => $this->is_locked,
            'participants_count' => $this->whenCounted('peserta'),
            'academic_year' => new TahunAkademikResource($this->whenLoaded('tahunAkademik')),
            'jenis_kkn' => new JenisKknResource($this->whenLoaded('jenisKkn')),
            'document_templates' => $this->whenLoaded('documentTemplates', fn () => $this->documentTemplates->map(fn ($assignment) => [
                'id' => $assignment->id,
                'requirement_id' => $assignment->jenis_kkn_document_requirement_id,
                'template_id' => $assignment->document_template_id,
            ])->values()),
            'settings_override' => $this->settings_override,
        ];
    }

    private function getPhaseLabel(?string $phase): string
    {
        return match ($phase) {
            'upcoming' => 'Pra-Pendaftaran',
            'registration' => 'Masa Pendaftaran',
            'placement' => 'Seleksi & Plotting',
            'execution' => 'Pelaksanaan KKN',
            'grading' => 'Masa Penilaian',
            'finished' => 'KKN Selesai',
            default => $phase ?? 'Tidak Diketahui',
        };
    }
}
