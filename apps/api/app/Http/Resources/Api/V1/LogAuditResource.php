<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LogAuditResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'action' => $this->action,
            'description' => $this->description,
            'severity' => $this->severity,
            // Field names match the `log_audit` schema. Previous version used
            // auditable_type/auditable_id which don't exist on the table and
            // silently returned null in responses.
            'model_type' => $this->model_type,
            'model_id' => $this->model_id,
            // Short class basename for UI (e.g. "Mahasiswa" instead of
            // "App\\Models\\KKN\\Mahasiswa").
            'model_basename' => $this->model_type
                ? class_basename($this->model_type)
                : null,
            'old_values' => $this->old_values,
            'new_values' => $this->new_values,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'created_at' => $this->created_at?->toIso8601String(),
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
