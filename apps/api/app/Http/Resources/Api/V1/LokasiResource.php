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
            'province_code' => $this->province_code,
            'regency_id' => $this->regency_id,
            'regency_code' => $this->regency_code,
            'district_id' => $this->district_id,
            'district_code' => $this->district_code,
            'regency_name' => $this->regency_name,
            'district_name' => $this->district_name,
            'village_code' => $this->village_code,
            'village_name' => $this->village_name,
            'full_name' => $this->full_name,
            'address' => $this->address,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'capacity' => $this->capacity,
            'is_selected_for_kkn' => (bool) $this->is_selected_for_kkn,
            'fakultas_id' => $this->fakultas_id,
            'faculty' => new FakultasResource($this->whenLoaded('fakultas')),

            // Stats — only exposed when `kelompok` relation is eager-loaded.
            // Dipakai oleh halaman /lokasi (peta sebaran realtime) untuk
            // menghitung badge counter per pin marker tanpa round-trip API
            // tambahan. Lihat PublicController::locations().
            'group_count' => $this->when(
                $this->relationLoaded('kelompok'),
                fn () => $this->kelompok->count()
            ),
            'students_count' => $this->when(
                $this->relationLoaded('kelompok'),
                fn () => (int) $this->kelompok->sum('peserta_count')
            ),
            'groups' => $this->when(
                $this->relationLoaded('kelompok'),
                fn () => $this->kelompok->map(fn ($group) => [
                    'id' => $group->id,
                    'nama_kelompok' => $group->nama_kelompok,
                    'code' => $group->code,
                    'peserta_count' => (int) ($group->peserta_count ?? 0),
                ])->values()
            ),
        ];
    }
}
