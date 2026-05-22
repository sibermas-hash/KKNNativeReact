<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Models\KKN\DokumenPesertaKkn;
use App\Services\KKN\RegistrationDocumentService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PesertaKknResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $documentPayload = $this->buildDocumentPayload();

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
            'approved_at' => $this->approved_at?->toIso8601String(),
            'revision_count' => $this->revision_count,
            'joined_group_at' => $this->joined_group_at?->toIso8601String(),
            'notification_shown' => $this->notification_shown,
            'mahasiswa' => new MahasiswaResource($this->whenLoaded('mahasiswa')),
            'kelompok' => new KelompokKknResource($this->whenLoaded('kelompok')),
            'periode' => new PeriodeResource($this->whenLoaded('periode')),
            'documents' => $this->when($documentPayload !== null, fn () => $documentPayload['documents']),
            'document_summary' => $this->when($documentPayload !== null, fn () => $documentPayload['summary']),
        ];
    }

    /**
     * @return array{documents: array<int, array<string, mixed>>, summary: array<string, mixed>}|null
     */
    private function buildDocumentPayload(): ?array
    {
        if (! $this->relationLoaded('dokumen') || ! $this->relationLoaded('periode') || ! $this->relationLoaded('mahasiswa')) {
            return null;
        }

        $documentService = app(RegistrationDocumentService::class);
        $requirements = $documentService->requirementsForPeriod($this->periode);
        $existingDocuments = $documentService->existingDocuments($this->mahasiswa, $this->periode, $this->resource);
        $uploadedDocuments = $this->dokumen->keyBy('document_type');
        $documents = [];
        $seenTypes = [];
        $fallbackId = -1;

        foreach ($requirements as $requirement) {
            $field = (string) $requirement['field'];
            $documentType = (string) ($requirement['document_type'] ?? $field);
            $document = $uploadedDocuments->get($documentType) ?? $uploadedDocuments->get($field);
            $existing = $existingDocuments[$field] ?? null;

            if (! $document instanceof DokumenPesertaKkn && ! (($existing['exists'] ?? false) === true)) {
                continue;
            }

            $documents[] = $this->documentArray($document, $existing, $documentType, $field, $fallbackId);
            $seenTypes[$documentType] = true;
            $seenTypes[$field] = true;
        }

        foreach ($this->dokumen as $document) {
            if (isset($seenTypes[(string) $document->document_type])) {
                continue;
            }

            $documents[] = $this->documentArray($document, null, (string) $document->document_type, (string) $document->document_type, $fallbackId);
        }

        $items = collect($requirements)->map(function (array $requirement) use ($uploadedDocuments, $existingDocuments) {
            $field = (string) $requirement['field'];
            $documentType = (string) ($requirement['document_type'] ?? $field);
            $document = $uploadedDocuments->get($documentType) ?? $uploadedDocuments->get($field);
            $existing = $existingDocuments[$field] ?? null;

            return [
                'field' => $field,
                'label' => $requirement['label'] ?? $field,
                'required' => (bool) ($requirement['required'] ?? false),
                'uploaded' => (bool) ($document instanceof DokumenPesertaKkn || (($existing['exists'] ?? false) === true)),
                'file_name' => $document?->file_name ?? ($existing['file_name'] ?? null),
                'file_path' => $document?->file_path ?? ($existing['file_path'] ?? null),
                'is_verified' => (bool) ($document?->is_verified ?? false),
            ];
        })->values();

        return [
            'documents' => $documents,
            'summary' => [
                'uploaded_count' => $items->where('uploaded', true)->count(),
                'required_count' => $items->where('required', true)->count(),
                'missing_required_count' => $items->where('required', true)->where('uploaded', false)->count(),
                'items' => $items->all(),
            ],
        ];
    }

    /**
     * @param array<string, mixed>|null $existing
     * @return array<string, mixed>
     */
    private function documentArray(
        ?DokumenPesertaKkn $document,
        ?array $existing,
        string $documentType,
        string $field,
        int &$fallbackId
    ): array {
        $uploadedAt = $document?->uploaded_at?->toIso8601String();

        return [
            'id' => $document?->id ?? $fallbackId--,
            'peserta_kkn_id' => $this->id,
            'document_type' => $documentType !== '' ? $documentType : $field,
            'file_path' => $document?->file_path ?? ($existing['file_path'] ?? null),
            'file_name' => $document?->file_name ?? ($existing['file_name'] ?? null),
            'status' => $document?->status,
            'notes' => $document?->notes,
            'is_verified' => (bool) ($document?->is_verified ?? false),
            'verified_at' => $document?->verified_at?->toIso8601String(),
            'verified_by' => $document?->verified_by,
            'is_archived' => (bool) ($document?->is_archived ?? false),
            'archived_at' => $document?->archived_at?->toIso8601String(),
            'uploaded_at' => $uploadedAt,
        ];
    }
}
