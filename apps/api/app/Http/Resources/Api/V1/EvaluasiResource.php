<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EvaluasiResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'mahasiswa_id' => $this->mahasiswa_id,
            'kelompok_id' => $this->kelompok_id,
            'evaluator_type' => $this->evaluator_type,
            'total_score' => $this->total_score,
            'grade' => $this->grade,
            'notes' => $this->notes,
            'evaluated_at' => $this->evaluated_at?->toIso8601String(),
            'items' => ItemEvaluasiResource::collection($this->whenLoaded('item')),
            'mahasiswa' => new MahasiswaResource($this->whenLoaded('mahasiswa')),
        ];
    }
}
