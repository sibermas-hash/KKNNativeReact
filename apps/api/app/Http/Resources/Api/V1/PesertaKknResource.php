<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PesertaKknResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'mahasiswa_id' => $this->mahasiswa_id,
            'periode_id' => $this->periode_id,
            'kelompok_id' => $this->kelompok_id,
            'status' => $this->status,
            'role' => $this->role,
            'notes' => $this->notes,
            'rejection_reason' => $this->rejection_reason,
            'registration_date' => $this->registration_date?->toIso8601String(),
            'first_uploaded_at' => $this->first_uploaded_at ? \Carbon\Carbon::parse($this->first_uploaded_at)->toIso8601String() : null,
            'approved_at' => $this->approved_at?->toIso8601String(),
            'revision_count' => $this->revision_count,
            'joined_group_at' => $this->joined_group_at?->toIso8601String(),
            'notification_shown' => $this->notification_shown,
            'mahasiswa' => new MahasiswaResource($this->whenLoaded('mahasiswa')),
            'kelompok' => new KelompokKknResource($this->whenLoaded('kelompok')),
            'periode' => new PeriodeResource($this->whenLoaded('periode')),
            'requires_interview' => $this->when($this->relationLoaded('periode'), fn () => in_array($this->periode?->jenisKkn?->code, ['NUSANTARA', 'INTERNASIONAL', 'KOLABORASI_PTKIN'], true)),
            'documents' => DokumenPesertaResource::collection($this->whenLoaded('dokumen')),
            'document_summary' => $this->when($this->relationLoaded('dokumen') && $this->relationLoaded('periode'), function () {
                $requirements = app(\App\Services\KKN\RegistrationDocumentService::class)->requirementsForPeriod($this->periode);
                $uploaded = $this->dokumen->keyBy('document_type');
                $items = collect($requirements)->map(function (array $requirement) use ($uploaded) {
                    $field = (string) $requirement['field'];
                    $doc = $uploaded->get($field);

                    return [
                        'field' => $field,
                        'label' => $requirement['label'] ?? $field,
                        'required' => (bool) ($requirement['required'] ?? false),
                        'uploaded' => (bool) $doc,
                        'file_name' => $doc?->file_name,
                        'is_verified' => (bool) ($doc?->is_verified ?? false),
                    ];
                })->values();

                return [
                    'uploaded_count' => $items->where('uploaded', true)->count(),
                    'required_count' => $items->where('required', true)->count(),
                    'missing_required_count' => $items->where('required', true)->where('uploaded', false)->count(),
                    'items' => $items->all(),
                ];
            }),
        ];
    }
}
