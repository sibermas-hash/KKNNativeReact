<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LokasiResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'province_id' => $this->province_id,
            'regency_id' => $this->regency_id,
            'district_id' => $this->district_id,
            'regency_name' => $this->regency_name,
            'district_name' => $this->district_name,
            'village_code' => $this->village_code,
            'village_name' => $this->village_name,
            'full_name' => $this->full_name,
            'address' => $this->address,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'capacity' => $this->capacity,
            'fakultas_id' => $this->fakultas_id,
            'faculty' => new FakultasResource($this->whenLoaded('fakultas')),
            'group_count' => $this->when(
                $this->relationLoaded('kelompok'),
                fn () => $this->kelompok->count()
            ),
        ];
    }
}
