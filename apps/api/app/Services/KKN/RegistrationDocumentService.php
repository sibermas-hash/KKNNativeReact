<?php

declare(strict_types=1);

namespace App\Services\KKN;

use App\Models\KKN\DokumenPesertaKkn;
use App\Models\KKN\JenisKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RegistrationDocumentService
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function requirementsForPeriod(Periode $period): array
    {
        $requirements = [];
        $jenisKkn = $this->resolveJenisKkn($period);

        if (($jenisKkn?->require_health_certificate ?? false) === true) {
            $requirements['health_certificate'] = $this->legacyRequirement(
                field: 'health_certificate',
                label: 'Surat Keterangan Sehat',
                description: 'Surat keterangan sehat dari dokter, puskesmas, atau rumah sakit.',
                icon: 'shield-check',
            );
        }

        if (($jenisKkn?->require_parent_permission ?? false) === true) {
            $requirements['parent_permission'] = $this->legacyRequirement(
                field: 'parent_permission',
                label: 'Surat Izin Orang Tua/Wali',
                description: 'Surat persetujuan bermaterai dari orang tua atau wali.',
                icon: 'file-text',
                templateUrl: asset('templates/surat_izin_orang_tua.docx'),
            );
        }

        foreach (($jenisKkn?->custom_requirements ?? []) as $documentLabel) {
            if (! is_string($documentLabel) || blank($documentLabel)) {
                continue;
            }

            $requirement = $this->customRequirement($documentLabel);

            if (isset($requirements[$requirement['field']])) {
                continue;
            }

            $requirements[$requirement['field']] = $requirement;
        }

        // 3. Type-specific auto-requirements (always apply regardless of config mode)
        if ($period->program_type === Periode::PROGRAM_TYPE_INTERNASIONAL_MANDIRI && ! isset($requirements['passport_scan'])) {
            $requirements['passport_scan'] = [
                'field' => 'passport_scan',
                'document_type' => 'passport_scan',
                'label' => 'Scan Paspor',
                'description' => 'Scan halaman identitas paspor aktif.',
                'required' => true,
                'icon' => 'id-card',
                'storage' => 'registration_document',
                'template_url' => null,
            ];
        }

        return array_values($requirements);
    }

    /**
     * @return array<string, array{exists: bool, file_name: string|null, file_path: string|null, status: string|null}>
     */
    public function existingDocuments(
        Mahasiswa $mahasiswa,
        Periode $period,
        ?PesertaKkn $registration = null
    ): array {
        $registration ??= $this->registrationForPeriod($mahasiswa, $period);
        $registration?->loadMissing('dokumen');

        $documentRows = collect($registration?->dokumen ?? [])
            ->keyBy(fn (DokumenPesertaKkn $document) => $document->document_type);

        $existing = [];

        foreach ($this->requirementsForPeriod($period) as $requirement) {
            $documentType = (string) $requirement['document_type'];
            $documentRow = $documentRows->get($documentType);
            $legacyPath = $this->legacyDocumentPath($mahasiswa, (string) $requirement['field']);

            $filePath = $documentRow?->file_path ?? $legacyPath;
            $existing[(string) $requirement['field']] = [
                'exists' => filled($filePath),
                'file_name' => $documentRow?->file_name ?? ($legacyPath ? basename($legacyPath) : null),
                'file_path' => $filePath,
                'status' => $documentRow?->status,
            ];
        }

        return $existing;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function validationRules(
        Periode $period,
        Mahasiswa $mahasiswa,
        ?PesertaKkn $registration = null
    ): array {
        $existing = $this->existingDocuments($mahasiswa, $period, $registration);
        $rules = [];

        foreach ($this->requirementsForPeriod($period) as $requirement) {
            $field = (string) $requirement['field'];
            $alreadyUploaded = (bool) ($existing[$field]['exists'] ?? false);

            $rules[$field] = [
                $requirement['required'] && ! $alreadyUploaded ? 'required' : 'nullable',
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:2048',
            ];
        }

        return $rules;
    }

    public function persistUploadedDocuments(
        Request $request,
        Mahasiswa $mahasiswa,
        Periode $period,
        PesertaKkn $registration
    ): void {
        $existing = $this->existingDocuments($mahasiswa, $period, $registration);

        foreach ($this->requirementsForPeriod($period) as $requirement) {
            $field = (string) $requirement['field'];

            $file = $request->file($field) ?? $request->file("dynamic_files.{$field}");

            if (! $file) {
                continue;
            }

            $oldPath = $existing[$field]['file_path'] ?? null;
            $path = $file->store($this->storageDirectoryFor($field), config('filesystems.default'));

            if (filled($oldPath) && $oldPath !== $path) {
                Storage::disk(config('filesystems.default'))->delete($oldPath);
            }

            $this->syncLegacyDocumentPath($mahasiswa, $field, $path);

            $document = DokumenPesertaKkn::query()->firstOrNew([
                'peserta_kkn_id' => $registration->id,
                'document_type' => (string) $requirement['document_type'],
            ]);

            $document->fill([
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'file_size' => (int) ($file->getSize() ?? 0),
                'uploaded_at' => now(),
                'status' => 'pending',
                'notes' => null,
                'is_verified' => false,
                'is_archived' => false,
                'verified_at' => null,
                'archived_at' => null,
                'verified_by' => null,
                'archived_by' => null,
            ]);
            $document->save();
        }
    }

    /**
     * @return array{required_count:int, uploaded_count:int, missing_labels:array<int, string>, flags:array<string, bool>}
     */
    public function summaryForRegistration(PesertaKkn $registration): array
    {
        $registration->loadMissing(['periode.jenisKkn', 'mahasiswa', 'dokumen']);

        if (! $registration->periode || ! $registration->mahasiswa) {
            return [
                'required_count' => 0,
                'uploaded_count' => 0,
                'missing_labels' => [],
                'flags' => [],
            ];
        }

        $requirements = $this->requirementsForPeriod($registration->periode);
        $existing = $this->existingDocuments($registration->mahasiswa, $registration->periode, $registration);

        $missingLabels = [];
        $uploadedCount = 0;
        $flags = [];

        foreach ($requirements as $requirement) {
            $field = (string) $requirement['field'];
            $exists = (bool) ($existing[$field]['exists'] ?? false);
            $flags[$field] = $exists;

            if ($exists) {
                $uploadedCount++;

                continue;
            }

            if (($requirement['required'] ?? false) === true) {
                $missingLabels[] = (string) $requirement['label'];
            }
        }

        return [
            'required_count' => count($requirements),
            'uploaded_count' => $uploadedCount,
            'missing_labels' => $missingLabels,
            'flags' => $flags,
        ];
    }

    private function registrationForPeriod(Mahasiswa $mahasiswa, Periode $period): ?PesertaKkn
    {
        return PesertaKkn::query()
            ->with('dokumen')
            ->where('mahasiswa_id', $mahasiswa->id)
            ->where('periode_id', $period->id)
            ->first();
    }

    private function resolveJenisKkn(Periode $period): ?JenisKkn
    {
        $jenisKkn = $period->relationLoaded('jenisKkn') ? $period->getRelation('jenisKkn') : null;

        $requiredAttributes = [
            'id',
            'name',
            'require_health_certificate',
            'require_parent_permission',
            'custom_requirements',
        ];

        if (! $jenisKkn || array_diff($requiredAttributes, array_keys($jenisKkn->getAttributes()))) {
            $jenisKkn = $period->jenisKkn()->first();
            $period->setRelation('jenisKkn', $jenisKkn);
        }

        return $jenisKkn;
    }

    /**
     * @return array<string, mixed>
     */
    private function legacyRequirement(
        string $field,
        string $label,
        string $description,
        string $icon,
        ?string $templateUrl = null
    ): array {
        return [
            'field' => $field,
            'document_type' => $field,
            'label' => $label,
            'description' => $description,
            'required' => true,
            'icon' => $icon,
            'storage' => 'legacy_student',
            'template_url' => $templateUrl,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function customRequirement(string $label): array
    {
        $field = $this->normalizeDocumentField($label);

        return match ($field) {
            'health_certificate' => $this->legacyRequirement(
                field: 'health_certificate',
                label: 'Surat Keterangan Sehat',
                description: 'Surat keterangan sehat dari dokter, puskesmas, atau rumah sakit.',
                icon: 'shield-check',
            ),
            'parent_permission' => $this->legacyRequirement(
                field: 'parent_permission',
                label: 'Surat Izin Orang Tua/Wali',
                description: 'Surat persetujuan bermaterai dari orang tua atau wali.',
                icon: 'file-text',
                templateUrl: asset('templates/surat_izin_orang_tua.docx'),
            ),
            default => [
                'field' => $field,
                'document_type' => $field,
                'label' => trim($label),
                'description' => 'Unggah dokumen pendukung untuk melengkapi persyaratan pendaftaran.',
                'required' => true,
                'icon' => $field === 'passport_scan' ? 'id-card' : 'file-text',
                'storage' => 'registration_document',
                'template_url' => null,
            ],
        };
    }

    private function normalizeDocumentField(string $label): string
    {
        $normalized = Str::lower(trim($label));

        $field = match (true) {
            Str::contains($normalized, ['surat sehat', 'keterangan sehat', 'health certificate']) => 'health_certificate',
            Str::contains($normalized, ['izin orang tua', 'izin wali', 'parent permission']) => 'parent_permission',
            Str::contains($normalized, ['paspor', 'passport']) => 'passport_scan',
            Str::contains($normalized, ['krs']) => 'krs',
            Str::contains($normalized, ['ukt', 'pembayaran', 'payment']) => 'payment_proof',
            Str::contains($normalized, ['asuransi', 'insurance']) => 'insurance_proof',
            default => Str::slug($label, '_'),
        };

        return $field !== '' ? $field : 'dokumen_'.Str::random(6);
    }

    private function legacyDocumentPath(Mahasiswa $mahasiswa, string $field): ?string
    {
        return match ($field) {
            'health_certificate' => $mahasiswa->health_certificate_path,
            'parent_permission' => $mahasiswa->parent_permission_path,
            default => null,
        };
    }

    private function syncLegacyDocumentPath(Mahasiswa $mahasiswa, string $field, string $path): void
    {
        $column = match ($field) {
            'health_certificate' => 'health_certificate_path',
            'parent_permission' => 'parent_permission_path',
            default => null,
        };

        if ($column === null) {
            return;
        }

        $mahasiswa->forceFill([$column => $path])->save();
    }

    private function storageDirectoryFor(string $field): string
    {
        return match ($field) {
            'health_certificate' => 'health-certificates',
            'parent_permission' => 'parent-permissions',
            default => 'registration-documents/'.$field,
        };
    }
}
