<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JenisKknResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'description' => $this->description,
            'registration_mode' => $this->registration_mode,
            'registration_mode_label' => $this->registrationModeLabel(),
            'placement_mode' => $this->placement_mode,
            'placement_mode_label' => $this->placementModeLabel(),
            'color' => $this->color,
            'is_active' => $this->is_active,
            'attendance_config' => $this->getAttendanceConfig(),
            'requirements_config' => $this->requirements_config,
        ];
    }
}
