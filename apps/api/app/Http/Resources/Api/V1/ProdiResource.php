<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProdiResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $fakultas = new FakultasResource($this->whenLoaded('fakultas'));

        return [
            'id' => $this->id,
            'nama' => $this->nama,
            'code' => $this->code,
            'fakultas_id' => $this->fakultas_id,
            'faculty' => $fakultas,
            'fakultas' => $fakultas,
        ];
    }
}
