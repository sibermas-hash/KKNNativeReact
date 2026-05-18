<?php

declare(strict_types=1);

namespace App\Services\KKN;

use App\Models\KKN\DokumenPesertaKkn;
use App\Models\KKN\JenisKkn;
use App\Models\KKN\JenisKknDocumentRequirement;
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
        $dynamicRequirements = $this->dynamicRequirementsForPeriod($period);

        if ($dynamicRequirements !== []) {
            return $dynamicRequirements;
        }

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

        $suratKesediaan = $this->suratKesediaanForJenisKkn($jenisKkn);
        if ($suratKesediaan !== null && ! isset($requirements['surat_kesediaan'])) {
            $requirements['surat_kesediaan'] = $suratKesediaan;
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
            $alreadyUploaded = $registration?->status === 'rejected' ? false : (bool) ($existing[$field]['exists'] ?? false);
            $rules[$field] = [
                $requirement['required'] && ! $alreadyUploaded ? 'required' : 'nullable',
                'file',
                'mimes:pdf',
                'max:5120',
            ];
        }

        return $rules;
    }

    public function persistUploadedDocuments(
        Request $request,
        Mahasiswa $mahasiswa,
        Periode $period,
        PesertaKkn $registration
    ): int {
        $existing = $this->existingDocuments($mahasiswa, $period, $registration);
        $uploadedCount = 0;

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
                'file_name' => $this->sanitizeFileName($file->getClientOriginalName()),
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
            $uploadedCount++;
        }

        return $uploadedCount;
    }

    /**
     * @return array<int, string>
     */
    public function uploadedDocumentFields(Request $request, Periode $period): array
    {
        $uploadedFields = [];

        foreach ($this->requirementsForPeriod($period) as $requirement) {
            $field = (string) $requirement['field'];

            if ($request->hasFile($field) || $request->hasFile("dynamic_files.{$field}")) {
                $uploadedFields[] = $field;
            }
        }

        return $uploadedFields;
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
     * @return array<int, array<string, mixed>>
     */
    private function dynamicRequirementsForPeriod(Periode $period): array
    {
        $period->loadMissing([
            'jenisKkn.documentRequirements.defaultTemplate',
            'documentTemplates.template',
            'documentTemplates.requirement',
        ]);

        $requirements = $period->jenisKkn?->documentRequirements ?? collect();
        if ($requirements->isEmpty()) {
            return [];
        }

        $overrides = $period->documentTemplates->keyBy('jenis_kkn_document_requirement_id');

        return $requirements->map(function (JenisKknDocumentRequirement $requirement) use ($overrides) {
            $override = $overrides->get($requirement->id);
            $template = $override?->template ?? $requirement->defaultTemplate;

            return [
                'field' => $requirement->document_key,
                'document_type' => $requirement->document_key,
                'label' => $requirement->document_label,
                'description' => $requirement->description ?: 'Unggah dokumen pendukung untuk melengkapi persyaratan pendaftaran.',
                'required' => $requirement->is_required,
                'icon' => 'file-text',
                'storage' => 'registration_document',
                'template_url' => $template ? route('api.v1.admin.document-templates.download', $template) : null,
            ];
        })->values()->all();
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

    private function suratKesediaanForJenisKkn(?JenisKkn $jenisKkn): ?array
    {
        $code = $jenisKkn?->code;

        $templates = [
            'NUSANTARA' => [
                'label' => 'Surat Kesediaan KKN Nusantara',
                'description' => 'Surat pernyataan kesediaan mengikuti KKN Nusantara.',
                'template' => 'templates/surat_kesediaan_kkn_nusantara.docx',
            ],
            'INTERNASIONAL' => [
                'label' => 'Surat Kesediaan Biaya Mandiri',
                'description' => 'Surat pernyataan kesediaan mengikuti KKN dengan biaya mandiri.',
                'template' => 'templates/surat_kesediaan_biaya_mandiri_kkn_internasional.docx',
            ],
            'KOLABORASI_PTKIN' => [
                'label' => 'Surat Kesediaan KKN Kolaboratif PTKIN',
                'description' => 'Surat pernyataan kesediaan mengikuti KKN Kolaboratif PTKIN.',
                'template' => 'templates/surat_kesediaan_kkn_kolaboratif_ptkin.docx',
            ],
            'KAMPUNG_ZAKAT' => [
                'label' => 'Surat Kesediaan KKN Tematik Kampung Zakat',
                'description' => 'Surat pernyataan kesediaan mengikuti KKN Tematik Kampung Zakat.',
                'template' => 'templates/surat_kesediaan_kkn_tematik_kampung_zakat.docx',
            ],
        ];

        if ($code === null || ! isset($templates[$code])) {
            return null;
        }

        $tpl = $templates[$code];

        return [
            'field' => 'surat_kesediaan',
            'document_type' => 'surat_kesediaan',
            'label' => $tpl['label'],
            'description' => $tpl['description'],
            'required' => true,
            'icon' => 'file-text',
            'storage' => 'registration_document',
            'template_url' => asset($tpl['template']),
        ];
    }

    /**
     * Sanitize user-provided filenames before storing.
     *
     * Prevents Content-Disposition header injection on download
     * (filename appears in `Content-Disposition: attachment; filename="..."`).
     * Strips control chars, quotes, line breaks, and path separators,
     * then truncates to 100 chars preserving extension.
     */
    private function sanitizeFileName(?string $name): string
    {
        $name = trim((string) $name);
        if ($name === '') {
            return 'document';
        }

        // Strip path separators (user could send `../../../etc/passwd`)
        $name = basename($name);

        // Strip control chars, quotes, backslash, and CR/LF (header injection)
        $name = preg_replace('/[\x00-\x1F\x7F"\'\\\\]/u', '', $name) ?? '';
        $name = str_replace(["\r", "\n"], '', $name);

        // Collapse whitespace runs
        $name = preg_replace('/\s+/', ' ', $name) ?? '';
        $name = trim($name);

        if ($name === '') {
            return 'document';
        }

        // Truncate to 100 chars, preserving extension
        if (mb_strlen($name) > 100) {
            $ext = pathinfo($name, PATHINFO_EXTENSION);
            $base = pathinfo($name, PATHINFO_FILENAME);
            $keep = 100 - (strlen($ext) ? strlen($ext) + 1 : 0);
            $name = mb_substr($base, 0, max(1, $keep)).($ext ? '.'.$ext : '');
        }

        return $name;
    }
}
