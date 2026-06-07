<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Route;

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
            'requires_interview' => (bool) $this->requires_interview,
            'sort_order' => $this->sort_order,
            'attendance_config' => $this->getAttendanceConfig(),
            'requirements_config' => $this->requirements_config,
            'document_requirements' => $this->whenLoaded('documentRequirements', fn () => $this->documentRequirements->map(fn ($requirement) => [
                'id' => $requirement->id,
                'document_key' => $requirement->document_key,
                'document_label' => $requirement->document_label,
                'description' => $requirement->description,
                'is_required' => $requirement->is_required,
                'sort_order' => $requirement->sort_order,
                'default_template_id' => $requirement->default_template_id,
                'default_template' => $requirement->defaultTemplate ? [
                    'id' => $requirement->defaultTemplate->id,
                    'name' => $requirement->defaultTemplate->name,
                    'file_name' => $requirement->defaultTemplate->file_name,
                    'download_url' => Route::has('api.v1.admin.document-templates.download')
                        ? route('api.v1.admin.document-templates.download', $requirement->defaultTemplate)
                        : null,
                ] : null,
            ])->values()),
        ];
    }
}
