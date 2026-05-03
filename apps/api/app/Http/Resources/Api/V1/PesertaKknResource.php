<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PesertaKknResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'mahasiswa_id' => $this->mahasiswa_id,
            'periode_id' => $this->periode_id,
            'kelompok_id' => $this->kelompok_id,
            'status' => $this->status,
            'role' => $this->role,
            'notes' => $this->notes,
            'rejection_reason' => $this->rejection_reason,
            'registration_date' => $this->registration_date?->toIso8601String(),
            'approved_at' => $this->approved_at?->toIso8601String(),
            'revision_count' => $this->revision_count,
            'joined_group_at' => $this->joined_group_at?->toIso8601String(),
            'notification_shown' => $this->notification_shown,
            'mahasiswa' => new MahasiswaResource($this->whenLoaded('mahasiswa')),
            'kelompok' => new KelompokKknResource($this->whenLoaded('kelompok')),
            'periode' => new PeriodeResource($this->whenLoaded('periode')),
            'documents' => DokumenPesertaResource::collection($this->whenLoaded('dokumen')),
        ];
    }
}
