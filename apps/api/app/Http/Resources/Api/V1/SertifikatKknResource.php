<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SertifikatKknResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'periode_id' => $this->periode_id,
            'certificate_number' => $this->certificate_number,
            'verification_token' => $this->verification_token,
            'nama_mahasiswa' => $this->nama_mahasiswa,
            'nim' => $this->nim,
            'nama_prodi' => $this->nama_prodi,
            'nama_fakultas' => $this->nama_fakultas,
            'lokasi_kkn' => $this->lokasi_kkn,
            'total_score' => $this->total_score,
            'letter_grade' => $this->letter_grade,
            'issued_at' => $this->issued_at?->toIso8601String(),
            'is_revoked' => $this->isRevoked(),
            'revoked_at' => $this->revoked_at?->toIso8601String(),
            'download_url' => url('/api/v1/public/verify-certificate/' . $this->verification_token),
        ];
    }
}
