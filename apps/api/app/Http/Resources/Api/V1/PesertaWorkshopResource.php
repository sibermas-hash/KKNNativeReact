<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PesertaWorkshopResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workshop_id' => $this->workshop_id,
            'user_id' => $this->user_id,
            'registered_at' => $this->registered_at?->toIso8601String(),
            'attended' => $this->attended,
            'attended_at' => $this->attended_at?->toIso8601String(),
            'is_passed' => $this->is_passed,
            'certificate_path' => $this->certificate_path,
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
