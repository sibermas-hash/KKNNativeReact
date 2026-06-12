<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NilaiKknResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'kelompok_id' => $this->kelompok_id,
            'desa' => [
                'interaksi' => $this->desa_interaksi_score,
                'disiplin' => $this->desa_disiplin_score,
                'kinerja' => $this->desa_kinerja_score,
                'subtotal' => $this->calculateVillageScore(),
            ],
            'dpl' => [
                'relevansi' => $this->dpl_relevansi_score,
                'ketercapaian' => $this->dpl_ketercapaian_score,
                'inovasi' => $this->dpl_inovasi_score,
                'administrasi' => $this->dpl_administrasi_score,
                'artikel' => $this->dpl_artikel_score,
                'subtotal' => $this->calculateDplScore(),
            ],
            'lppm' => [
                'workshop' => $this->workshop_score,
                'administration' => $this->administration_score,
                'subtotal' => $this->calculateLppmScore(),
            ],
            'dpl_weighted_score' => $this->dpl_weighted_score,
            'village_weighted_score' => $this->village_weighted_score,
            'lppm_weighted_score' => $this->lppm_weighted_score,
            'total_score' => $this->total_score,
            'letter_grade' => $this->letter_grade,
            'is_finalized' => $this->is_finalized,
            'dpl_graded_at' => $this->dpl_graded_at?->toIso8601String(),
            'village_graded_at' => $this->village_graded_at?->toIso8601String(),
            'admin_graded_at' => $this->admin_graded_at?->toIso8601String(),
            'user' => new UserResource($this->whenLoaded('user')),
            'kelompok' => new KelompokKknResource($this->whenLoaded('kelompok')),
        ];
    }
}
