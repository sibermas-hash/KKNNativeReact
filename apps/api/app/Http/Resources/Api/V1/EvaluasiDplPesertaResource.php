<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EvaluasiDplPesertaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'mahasiswa_id' => $this->mahasiswa_id,
            'dosen_id' => $this->dosen_id,
            'kelompok_id' => $this->kelompok_id,
            'comment' => $this->comment,
            'created_at' => $this->created_at?->toIso8601String(),
            'mahasiswa' => new MahasiswaResource($this->whenLoaded('mahasiswa')),
            'items' => ItemEvaluasiDplPesertaResource::collection($this->whenLoaded('items')),
        ];
    }
}
