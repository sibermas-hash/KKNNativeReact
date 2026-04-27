<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Services\KKN\RegistrationDocumentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationDocumentController extends Controller
{
    public function __construct(
        private readonly RegistrationDocumentService $documentService,
    ) {}

    /**
     * Show the document upload page for a specific KKN period.
     */
    public function show(Request $request, int $periodeId): Response|RedirectResponse
    {
        $user = $request->user();
        $mahasiswa = $user?->mahasiswa;

        if (! $mahasiswa) {
            return redirect()->route('profile.show')
                ->with('error', 'Profil mahasiswa belum ditemukan.');
        }

        $period = Periode::with('jenisKkn')->find($periodeId);
        if (! $period) {
            return redirect()->route('student.daftar.index')
                ->with('error', 'Periode KKN tidak ditemukan.');
        }

        // Guard: mahasiswa hanya boleh mendaftar KKN 1 kali seumur hidup
        $existingAny = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->whereNotIn('status', ['rejected', 'cancelled'])
            ->where('periode_id', '!=', $periodeId) // Kecuali periode yang sama (re-upload dokumen)
            ->exists();

        if ($existingAny) {
            return redirect()->route('student.daftar.index')
                ->with('error', 'Anda sudah terdaftar pada periode KKN lain. Setiap mahasiswa hanya boleh mendaftar 1 kali.');
        }

        // Check if already registered for this period
        $registration = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
            ->where('periode_id', $periodeId)
            ->first();

        // Build document requirements based on KKN type
        $documentRequirements = $this->documentService->requirementsForPeriod($period);
        $existingDocuments = $this->documentService->existingDocuments($mahasiswa, $period, $registration);

        return Inertia::render('Student/Register/UploadDokumen', [
            'period' => [
                'id' => $period->id,
                'name' => $period->name,
                'program_type' => $period->program_type,
                'jenis' => $period->jenisKkn ? [
                    'name' => $period->jenisKkn->name,
                    'code' => $period->jenisKkn->code,
                ] : null,
            ],
            'registration' => $registration ? [
                'id' => $registration->id,
                'status' => $registration->status,
            ] : null,
            'document_requirements' => $documentRequirements,
            'existing_documents' => collect($existingDocuments)
                ->map(fn (array $document) => (bool) ($document['exists'] ?? false))
                ->all(),
        ]);
    }

    /**
     * Upload documents and finalize the registration.
     */
    public function store(Request $request, int $periodeId): RedirectResponse
    {
        $user = $request->user();
        $mahasiswa = $user?->mahasiswa;

        if (! $mahasiswa) {
            return redirect()->back()->with('error', 'Profil mahasiswa tidak ditemukan.');
        }

        $period = Periode::with('jenisKkn')->find($periodeId);
        if (! $period) {
            return redirect()->route('student.daftar.index')
                ->with('error', 'Periode KKN tidak ditemukan.');
        }

        $registration = PesertaKkn::query()
            ->with('dokumen')
            ->where('mahasiswa_id', $mahasiswa->id)
            ->where('periode_id', $periodeId)
            ->first();

        $validated = $request->validate([
            ...$this->documentService->validationRules($period, $mahasiswa, $registration),
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);


        try {
            DB::beginTransaction();

            $registration = PesertaKkn::query()->firstOrCreate(
                [
                    'mahasiswa_id' => $mahasiswa->id,
                    'periode_id' => $periodeId,
                ],
                [
                    'status' => 'document_submitted',
                    'notes' => $validated['notes'] ?? null,
                    'registration_date' => now(),
                ]
            );

            if ($registration->wasRecentlyCreated === false && in_array($registration->status, ['pending', 'rejected', 'document_submitted'], true)) {
                $registration->update([
                    'status' => 'document_submitted',
                    'notes' => $validated['notes'] ?? $registration->notes,
                ]);
            }

            $this->documentService->persistUploadedDocuments($request, $mahasiswa, $period, $registration);

            DB::commit();

            return redirect()->route('student.dashboard')
                ->with('success', "Dokumen persyaratan untuk {$period->name} berhasil diunggah. Pendaftaran Anda sedang ditinjau oleh admin.");

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Document upload failed', ['error' => $e->getMessage()]);

            return redirect()->back()->with('error', 'Terjadi kesalahan saat mengunggah dokumen.');
        }
    }
}
