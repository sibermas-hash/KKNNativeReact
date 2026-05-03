<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DosenResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'nip' => $this->nip,
            'nama' => $this->nama,
            'phone' => $this->phone,
            'jabatan' => $this->jabatan,
            'golongan' => $this->golongan,
            'gender' => $this->gender,
            'birth_date' => $this->birth_date?->toDateString(),
            'is_cpns' => $this->is_cpns,
            'is_tugas_belajar' => $this->is_tugas_belajar,
            'faculty' => new FakultasResource($this->whenLoaded('fakultas')),
        ];
    }
}
