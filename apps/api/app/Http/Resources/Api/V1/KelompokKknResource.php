<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KelompokKknResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'periode_id' => $this->periode_id,
            'nama_kelompok' => $this->nama_kelompok,
            'code' => $this->code,
            'capacity' => $this->capacity,
            'status' => $this->status,
            'location' => new LokasiResource($this->whenLoaded('lokasi')),
            'dpl' => DosenResource::collection($this->whenLoaded('dosen')),
            'ketua_dpl' => new DosenResource($this->whenLoaded('dosen') ? $this->ketua_dpl : null),
            'member_count' => $this->when(
                $this->relationLoaded('peserta'),
                fn () => $this->peserta->where('status', 'approved')->count()
            ),
            'members' => PesertaKknResource::collection($this->whenLoaded('peserta')),
            'posko' => new PoskoResource($this->whenLoaded('posko')),
            'poster' => [
                'path' => $this->poster_potensi_desa_path,
                'name' => $this->poster_potensi_desa_name,
                'type' => $this->poster_potensi_desa_type,
            ],
            'period' => new PeriodeResource($this->whenLoaded('periode')),
        ];
    }
}
