<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DownloadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'file_name' => $this->file_name,
            'file_path' => $this->file_path,
            'file_url' => $this->file_path ? asset('storage/'.$this->file_path) : null,
            'external_url' => $this->external_url,
            'file_type' => $this->file_type,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
