<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProposalProgramKerjaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'program_kerja_id' => $this->program_kerja_id,
            'version' => $this->version,
            'file_path' => $this->file_path,
            'file_name' => $this->file_name,
            'uploaded_at' => $this->uploaded_at?->toIso8601String(),
            'notes' => $this->notes,
        ];
    }
}
