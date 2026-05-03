<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PoskoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kelompok_id' => $this->kelompok_id,
            'nama_posko' => $this->nama_posko,
            'address' => $this->address,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'radius_meters' => $this->radius_meters,
            'photo_url' => $this->photo_path ? asset('storage/'.$this->photo_path) : null,
            'gmaps_link' => $this->gmaps_link,
        ];
    }
}
