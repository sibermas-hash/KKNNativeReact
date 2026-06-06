<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\URL;

class IzinMeninggalkanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'mahasiswa_id' => $this->mahasiswa_id,
            'kelompok_id' => $this->kelompok_id,
            'type' => 'izin',
            'reason' => $this->alasan,
            'start_date' => $this->tanggal_mulai?->toDateString(),
            'end_date' => $this->tanggal_kembali?->toDateString(),
            'tanggal_mulai' => $this->tanggal_mulai?->toDateString(),
            'tanggal_kembali' => $this->tanggal_kembali?->toDateString(),
            'durasi_hari' => $this->durasi_hari,
            'alasan' => $this->alasan,
            'status' => $this->status,
            'rejection_reason' => $this->catatan_dpl,
            'catatan_dpl' => $this->catatan_dpl,
            'file_url' => $this->file_bukti ? URL::temporarySignedRoute('api.v1.files.leave-evidence', now()->addMinutes(30), $this->resource) : null,
            'mahasiswa' => new MahasiswaResource($this->whenLoaded('mahasiswa')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
