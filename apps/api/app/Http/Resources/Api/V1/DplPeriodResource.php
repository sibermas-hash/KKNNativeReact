<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DplPeriodResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'dosen_id' => $this->dosen_id,
            'periode_id' => $this->periode_id,
            'max_kelompok_kkn' => $this->max_kelompok_kkn,
            'is_active' => $this->is_active,
            'status' => $this->status,
            'approved_at' => $this->approved_at?->toIso8601String(),
            'rejection_reason' => $this->rejection_reason,
            'remaining_slots' => $this->getRemainingSlots(),
            'has_capacity' => $this->hasCapacity(),
            'dosen' => new DosenResource($this->whenLoaded('dosen')),
            'periode' => new PeriodeResource($this->whenLoaded('periode')),
            'kelompok' => KelompokKknResource::collection($this->whenLoaded('kelompok')),
        ];
    }
}
