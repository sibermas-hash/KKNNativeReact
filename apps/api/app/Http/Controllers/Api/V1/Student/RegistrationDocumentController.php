<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\DocumentTemplate;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Services\KKN\RegistrationDocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RegistrationDocumentController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly RegistrationDocumentService $documentService,
    ) {}

    public function store(Request $request, int $id): JsonResponse
    {
        $user = auth()->user();
        $mahasiswa = $user->mahasiswa;

        if (! $mahasiswa) {
            return $this->forbidden();
        }

        // Frontend lama mengirim {id}=periode_id, frontend baru mengirim {id}=registration_id.
        // Dukung keduanya agar /registration/{id}/documents tidak 404 palsu.
        $registration = PesertaKkn::with(['periode.jenisKkn'])
            ->where('mahasiswa_id', $mahasiswa->id)
            ->where('id', $id)
            ->first();

        if (! $registration) {
            $registration = PesertaKkn::with(['periode.jenisKkn'])
                ->where('mahasiswa_id', $mahasiswa->id)
                ->where('periode_id', $id)
                ->first();
        }

        if (! $registration) {
            return $this->notFound('Pendaftaran tidak ditemukan.');
        }

        $periode = $registration->periode;

        if (in_array($registration->status, ['document_verified', 'approved'], true)) {
            throw ValidationException::withMessages([
                'status' => 'Dokumen sudah dikirim dan menunggu atau sudah diverifikasi admin. Upload ulang hanya bisa setelah admin menolak pendaftaran.',
            ]);
        }

        if (! $periode) {
            return $this->notFound('Periode pendaftaran tidak ditemukan.');
        }

        $this->normalizeUploadedDocumentFiles($request, $periode);
        $uploadedFields = $this->documentService->uploadedDocumentFields($request, $periode);

        logger()->info('student.documents.upload.debug', [
            'registration_id' => $registration->id,
            'periode_id' => $periode->id,
            'file_keys' => array_keys($request->allFiles()),
            'input_keys' => array_keys($request->except(array_keys($request->allFiles()))),
            'uploaded_fields' => $uploadedFields,
        ]);

        if ($uploadedFields === []) {
            logger()->warning('student.documents.upload.empty_request', [
                'registration_id' => $registration->id,
                'periode_id' => $periode->id,
                'file_keys' => array_keys($request->allFiles()),
                'files' => $this->uploadedFileDebug($request->allFiles()),
            ]);

            return $this->validationError(
                ['documents' => ['Pilih minimal satu dokumen untuk diunggah.']],
                'Pilih minimal satu dokumen untuk diunggah.'
            );
        }

        // Validasi dinamis berdasarkan requirements jenisKkn (sesuai codebase lama)
        $rules = $this->documentService->validationRules($periode, $mahasiswa, $registration);
        $rules['notes'] = ['nullable', 'string', 'max:1000'];

        try {
            $request->validate($rules);
        } catch (ValidationException $exception) {
            logger()->warning('student.documents.upload.validation_failed', [
                'registration_id' => $registration->id,
                'periode_id' => $periode->id,
                'errors' => $exception->errors(),
                'file_keys' => array_keys($request->allFiles()),
                'files' => $this->uploadedFileDebug($request->allFiles()),
                'uploaded_fields' => $uploadedFields,
                'rules' => $rules,
            ]);

            throw $exception;
        }

        // Simpan dokumen ke DokumenPesertaKkn + sync legacy path (sesuai codebase lama)
        $uploadedCount = $this->documentService->persistUploadedDocuments($request, $mahasiswa, $periode, $registration);

        // Update status ke document_submitted hanya jika ada file yang benar-benar
        // diterima dan disimpan. Ini mencegah request kosong/legacy path lama
        // mengunci mahasiswa di status document_submitted tanpa upload baru.
        if ($uploadedCount > 0 && in_array($registration->status, ['pending', 'rejected'])) {
            $updateData = ['status' => 'document_submitted'];
            if ($registration->status === 'rejected') {
                $updateData['resubmitted_at'] = now();
                $updateData['revision_count'] = ($registration->revision_count ?? 0) + 1;
                $updateData['rejection_reason'] = null;
            }
            $registration->update($updateData);
        }

        return $this->noContent('Dokumen berhasil diunggah.');
    }

    private function normalizeUploadedDocumentFiles(Request $request, Periode $periode): void
    {
        $files = $request->files;
        $documents = $files->get('documents', []);
        $dynamicFiles = $files->get('dynamic_files', []);

        $requirements = $this->documentService->requirementsForPeriod($periode);

        foreach ($requirements as $requirement) {
            $field = (string) $requirement['field'];

            // Terima semua pola frontend yg pernah dipakai:
            // 1) health_certificate
            // 2) documents[health_certificate]
            // 3) dynamic_files[health_certificate]
            if (! $files->has($field) && is_array($documents) && isset($documents[$field])) {
                $files->set($field, $documents[$field]);
            }

            if (! $files->has($field) && is_array($dynamicFiles) && isset($dynamicFiles[$field])) {
                $files->set($field, $dynamicFiles[$field]);
            }
        }

        // Fallback anti-gagal: bila frontend mengirim key acak/array lain,
        // map file secara urutan ke requirement yg masih kosong.
        $flatFiles = $this->flattenUploadedFiles($files->all());
        $index = 0;

        foreach ($requirements as $requirement) {
            $field = (string) $requirement['field'];

            if ($files->has($field)) {
                continue;
            }

            if (isset($flatFiles[$index])) {
                $files->set($field, $flatFiles[$index]);
                $index++;
            }
        }
    }

    /**
     * @param array<string, mixed> $items
     * @return array<int, UploadedFile>
     */
    private function flattenUploadedFiles(array $items): array
    {
        $flat = [];

        foreach ($items as $item) {
            if ($item instanceof UploadedFile) {
                $flat[] = $item;
                continue;
            }

            if (is_array($item)) {
                array_push($flat, ...$this->flattenUploadedFiles($item));
            }
        }

        return $flat;
    }

    /**
     * @param array<string, mixed> $items
     * @return array<string, mixed>
     */
    private function uploadedFileDebug(array $items): array
    {
        $debug = [];

        foreach ($items as $key => $item) {
            if ($item instanceof UploadedFile) {
                $debug[(string) $key] = [
                    'name' => $item->getClientOriginalName(),
                    'mime' => $item->getClientMimeType(),
                    'ext' => $item->getClientOriginalExtension(),
                    'size' => $item->getSize(),
                    'valid' => $item->isValid(),
                    'error' => $item->getError(),
                ];
                continue;
            }

            if (is_array($item)) {
                $debug[(string) $key] = $this->uploadedFileDebug($item);
            }
        }

        return $debug;
    }

    public function downloadTemplate(Request $request, int $id, string $documentKey): StreamedResponse|JsonResponse
    {
        $user = $request->user();
        $mahasiswa = $user?->mahasiswa;

        if (! $mahasiswa) {
            return $this->forbidden();
        }

        $periode = Periode::with([
            'jenisKkn.documentRequirements.defaultTemplate',
            'documentTemplates.requirement',
            'documentTemplates.template',
        ])->findOrFail($id);

        $requirements = $this->documentService->requirementsForPeriod($periode);
        $requirement = collect($requirements)->firstWhere('field', $documentKey);

        if (! $requirement || blank($requirement['template_url'] ?? null)) {
            return $this->notFound('Template dokumen tidak ditemukan.');
        }

        $assignment = $periode->documentTemplates
            ->first(fn ($item) => $item->requirement?->document_key === $documentKey);

        $template = $assignment?->template
            ?? $periode->jenisKkn?->documentRequirements?->firstWhere('document_key', $documentKey)?->defaultTemplate;

        if (! $template instanceof DocumentTemplate) {
            return $this->notFound('Template dokumen tidak ditemukan.');
        }

        return Storage::disk(config('filesystems.default'))->download($template->file_path, $template->file_name);
    }
}
