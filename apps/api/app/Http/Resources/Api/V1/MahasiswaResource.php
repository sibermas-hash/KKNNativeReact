<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MahasiswaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'nim' => $this->nim,
            'nama' => $this->nama,
            'nik' => $this->nik,
            'mother_name' => $this->mother_name,
            'gender' => $this->gender,
            'shirt_size' => $this->shirt_size,
            'birth_place' => $this->birth_place,
            'birth_date' => $this->birth_date?->toDateString(),
            'semester' => $this->semester,
            'sks_completed' => $this->sks_completed,
            'gpa' => $this->gpa,
            'batch_year' => $this->batch_year,
            'status_bta_ppi' => $this->status_bta_ppi,
            'is_paid_ukt' => $this->is_paid_ukt,
            'health_certificate_path' => $this->health_certificate_path,
            'parent_permission_path' => $this->parent_permission_path,
            'faculty' => new FakultasResource($this->whenLoaded('fakultas')),
            'prodi' => new ProdiResource($this->whenLoaded('prodi')),
            'profile_completion' => $this->profile_completion,
            'domisili' => [
                'lat' => $this->domisili_lat,
                'lng' => $this->domisili_lng,
                'address' => $this->domisili_address,
                'village' => $this->domisili_village,
                'district' => $this->domisili_district,
                'regency' => $this->domisili_regency,
                'province' => $this->domisili_province,
                'postal_code' => $this->domisili_postal_code,
                'registered_at' => $this->domisili_registered_at?->toIso8601String(),
            ],
        ];
    }
}
