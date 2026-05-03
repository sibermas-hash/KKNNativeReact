<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DokumenPesertaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'peserta_kkn_id' => $this->peserta_kkn_id,
            'document_type' => $this->document_type,
            'file_path' => $this->file_path,
            'file_name' => $this->file_name,
            'status' => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'uploaded_at' => $this->uploaded_at?->toIso8601String(),
        ];
    }
}
