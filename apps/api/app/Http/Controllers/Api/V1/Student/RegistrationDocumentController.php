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
use Illuminate\Support\Facades\Storage;
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

        $registration = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->where('periode_id', $id)
            ->first();

        if (! $registration) {
            return $this->notFound('Pendaftaran tidak ditemukan.');
        }

        $periode = Periode::with('jenisKkn')->findOrFail($id);

        // Validasi dinamis berdasarkan requirements jenisKkn (sesuai codebase lama)
        $rules = $this->documentService->validationRules($periode, $mahasiswa, $registration);
        $rules['notes'] = ['nullable', 'string', 'max:1000'];

        $request->validate($rules);

        // Simpan dokumen ke DokumenPesertaKkn + sync legacy path (sesuai codebase lama)
        $this->documentService->persistUploadedDocuments($request, $mahasiswa, $periode, $registration);

        // Update status ke document_submitted jika masih pending atau rejected (resubmission)
        if (in_array($registration->status, ['pending', 'rejected'])) {
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
