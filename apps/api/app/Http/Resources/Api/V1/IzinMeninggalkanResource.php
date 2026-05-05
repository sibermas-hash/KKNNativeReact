<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IzinMeninggalkanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'mahasiswa_id' => $this->mahasiswa_id,
            'kelompok_id' => $this->kelompok_id,
            'type' => $this->type,
            'reason' => $this->reason,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'status' => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'file_url' => $this->file_bukti_path ? asset('storage/' . $this->file_bukti_path) : null,
            'mahasiswa' => new MahasiswaResource($this->whenLoaded('mahasiswa')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
