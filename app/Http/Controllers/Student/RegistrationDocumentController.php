<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationDocumentController extends Controller
{
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
        $documentRequirements = $this->getDocumentRequirements($period);

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
            'existing_documents' => [
                'has_health_certificate' => (bool) $mahasiswa->health_certificate_path,
                'has_parent_permission' => (bool) $mahasiswa->parent_permission_path,
            ],
            'parent_permission_template' => asset('templates/surat_izin_orang_tua.docx'),
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

        $period = Periode::find($periodeId);
        if (! $period) {
            return redirect()->route('student.daftar.index')
                ->with('error', 'Periode KKN tidak ditemukan.');
        }

        $documentRequirements = $this->getDocumentRequirements($period);

        // Build validation rules dynamically based on requirements
        $rules = [];
        foreach ($documentRequirements as $doc) {
            $key = $doc['field'];
            if ($doc['required'] && ! $this->hasExistingDocument($mahasiswa, $key)) {
                $rules[$key] = ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:2048'];
            } else {
                $rules[$key] = ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:2048'];
            }
        }
        $rules['notes'] = ['nullable', 'string', 'max:1000'];

        $validated = $request->validate($rules);

        try {
            DB::beginTransaction();

            // Upload files
            if ($request->hasFile('health_certificate')) {
                $path = $request->file('health_certificate')->store('health-certificates', config('filesystems.default'));
                $mahasiswa->update(['health_certificate_path' => $path]);
            }

            if ($request->hasFile('parent_permission')) {
                $path = $request->file('parent_permission')->store('parent-permissions', config('filesystems.default'));
                $mahasiswa->update(['parent_permission_path' => $path]);
            }

            // Create or update registration
            $registration = PesertaKkn::firstOrCreate(
                [
                    'mahasiswa_id' => $mahasiswa->id,
                    'periode_id' => $periodeId,
                ],
                [
                    'status' => 'document_submitted',
                    'notes' => $validated['notes'] ?? null,
                    'registered_at' => now(),
                    'registered_by' => $user->id,
                ]
            );

            if ($registration->wasRecentlyCreated === false && $registration->status === 'pending') {
                $registration->update([
                    'status' => 'document_submitted',
                    'notes' => $validated['notes'] ?? $registration->notes,
                ]);
            }

            DB::commit();

            return redirect()->route('student.dashboard')
                ->with('success', "Dokumen persyaratan untuk {$period->name} berhasil diunggah. Pendaftaran Anda sedang ditinjau oleh admin.");

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Document upload failed', ['error' => $e->getMessage()]);

            return redirect()->back()->with('error', 'Terjadi kesalahan saat mengunggah dokumen.');
        }
    }

    /**
     * Get document requirements based on KKN period/type.
     */
    private function getDocumentRequirements(Periode $period): array
    {
        $governance = $period->governance();
        $programType = $governance['program_type'] ?? 'reguler';

        // Base documents required for ALL KKN types
        $docs = [
            [
                'field' => 'health_certificate',
                'label' => 'Surat Keterangan Sehat',
                'description' => 'Surat keterangan sehat dari dokter/puskesmas/rumah sakit.',
                'required' => true,
                'icon' => 'shield-check',
            ],
            [
                'field' => 'parent_permission',
                'label' => 'Surat Izin Orang Tua/Wali',
                'description' => 'Surat persetujuan bermaterai dari orang tua/wali.',
                'required' => true,
                'icon' => 'file-text',
                'has_template' => true,
            ],
        ];

        // Additional documents for specific KKN types
        if ($programType === Periode::PROGRAM_TYPE_INTERNASIONAL_MANDIRI) {
            $docs[] = [
                'field' => 'passport_scan',
                'label' => 'Scan Paspor',
                'description' => 'Scan halaman identitas paspor aktif.',
                'required' => true,
                'icon' => 'id-card',
            ];
        }

        return $docs;
    }

    private function hasExistingDocument(Mahasiswa $mahasiswa, string $field): bool
    {
        return match ($field) {
            'health_certificate' => (bool) $mahasiswa->health_certificate_path,
            'parent_permission' => (bool) $mahasiswa->parent_permission_path,
            default => false,
        };
    }
}
