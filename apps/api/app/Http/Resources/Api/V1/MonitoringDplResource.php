<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MonitoringDplResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'dpl_id' => $this->dpl_id,
            'kelompok_id' => $this->kelompok_id,
            'visit_date' => $this->tanggal_kunjungan?->toDateString(),
            'notes' => $this->catatan_tambahan,
            'permasalahan' => $this->permasalahan,
            'solusi' => $this->solusi,
            'kelompok' => new KelompokKknResource($this->whenLoaded('kelompok')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
