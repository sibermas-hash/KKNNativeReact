<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Services\KKN\RegistrationDocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

        // Update status ke document_submitted jika masih pending
        if ($registration->status === 'pending') {
            $registration->update(['status' => 'document_submitted']);
        }

        return $this->noContent('Dokumen berhasil diunggah.');
    }
}
