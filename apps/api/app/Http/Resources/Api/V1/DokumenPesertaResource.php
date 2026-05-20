<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class DokumenPesertaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $fileExists = filled($this->file_path) && Storage::disk(config('filesystems.default'))->exists($this->file_path);

        return [
            'id' => $this->id,
            'peserta_kkn_id' => $this->peserta_kkn_id,
            'document_type' => $this->document_type,
            'file_path' => $this->file_path,
            'file_name' => $this->file_name,
            'file_exists' => $fileExists,
            'status' => $this->status,
            'notes' => $this->notes,
            'is_verified' => (bool) $this->is_verified,
            'verified_at' => $this->verified_at?->toIso8601String(),
            'verified_by' => $this->verified_by,
            'is_archived' => (bool) $this->is_archived,
            'archived_at' => $this->archived_at?->toIso8601String(),
            'uploaded_at' => $this->uploaded_at?->toIso8601String(),
        ];
    }
}
