<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\ProposalProgramKerja;
use App\Models\KKN\ProgramKerja;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class WorkProgramController extends Controller
{
    private function approvedRegistration(): ?PesertaKkn
    {
        $mahasiswa = auth()->user()->mahasiswa;

        return $mahasiswa?->peserta()->where('status', 'approved')->first();
    }

    private function authorizeProgramAccess(ProgramKerja $programKerja): void
    {
        $registration = $this->approvedRegistration();

        abort_unless(
            $registration && $registration->kelompok_id && $registration->kelompok_id === $programKerja->kelompok_id,
            403,
            'Anda tidak memiliki akses ke program kerja ini.'
        );
    }

    private function createProposalRecord(ProgramKerja $programKerja, UploadedFile $file): ProposalProgramKerja
    {
        $nextVersion = ((int) $programKerja->proposals()->max('version')) + 1;
        $path = $file->store("program-kerja/proposals/{$programKerja->id}", 'public');

        return $programKerja->proposals()->create([
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'version' => $nextVersion,
            'uploaded_at' => now(),
        ]);
    }

    public function index(): Response
    {
        $pendaftaran = $this->approvedRegistration();

        $programKerja = $pendaftaran && $pendaftaran->kelompok_id
            ? ProgramKerja::with('latestProposal')
                ->where('kelompok_id', $pendaftaran->kelompok_id)
                ->orderByDesc('created_at')
                ->get()
                ->map(fn (ProgramKerja $program) => [
                    'id' => $program->id,
                    'title' => $program->title,
                    'description' => $program->description,
                    'objectives' => $program->objectives,
                    'budget' => $program->budget,
                    'status' => $program->status,
                    'latest_proposal' => $program->latestProposal ? [
                        'id' => $program->latestProposal->id,
                        'file_name' => $program->latestProposal->file_name,
                        'version' => $program->latestProposal->version,
                        'uploaded_at' => $program->latestProposal->uploaded_at?->toIso8601String(),
                    ] : null,
                ])
                ->values()
            : collect();

        return Inertia::render('Student/WorkPrograms/Index', [
            'workPrograms' => $programKerja,
            'canCreate' => $pendaftaran && $pendaftaran->kelompok_id,
        ]);
    }

    public function create(): Response
    {
        $pendaftaran = $this->approvedRegistration();

        abort_unless(
            $pendaftaran && $pendaftaran->kelompok_id,
            403,
            'Anda belum ditempatkan ke dalam kelompok.'
        );

        return Inertia::render('Student/WorkPrograms/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $pendaftaran = $this->approvedRegistration();

        if (! $pendaftaran || ! $pendaftaran->kelompok_id) {
            return redirect()->back()->with('error', 'Tindakan ditolak: Anda belum ditempatkan ke dalam kelompok.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'objectives' => ['nullable', 'string'],
            'target_participants' => ['nullable', 'integer', 'min:1'],
            'budget' => ['required', 'numeric', 'min:0'],
            'kategori' => ['required', 'in:unggulan,pendukung'],
            'proposal_file' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:4096'],
        ]);

        /** @var UploadedFile|null $proposalFile */
        $proposalFile = $validated['proposal_file'] ?? null;
        unset($validated['proposal_file']);

        $programKerja = ProgramKerja::create([
            'kelompok_id' => $pendaftaran->kelompok_id,
            ...$validated,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        if ($proposalFile) {
            $this->createProposalRecord($programKerja, $proposalFile);
        }

        return redirect()->route('student.program-kerja.index')
            ->with('success', 'Program kerja berhasil diajukan.');
    }

    public function show(ProgramKerja $programKerja): Response
    {
        $this->authorizeProgramAccess($programKerja);
        $programKerja->load(['proposals', 'kelompok.lokasi']);

        return Inertia::render('Student/WorkPrograms/Show', [
            'workProgram' => [
                'id' => $programKerja->id,
                'title' => $programKerja->title,
                'description' => $programKerja->description,
                'objectives' => $programKerja->objectives,
                'target_participants' => $programKerja->target_participants,
                'budget' => $programKerja->budget,
                'status' => $programKerja->status,
                'kategori' => $programKerja->kategori,
                'submitted_at' => $programKerja->submitted_at?->toIso8601String(),
                'location' => $programKerja->kelompok?->lokasi?->full_name,
                'proposals' => $programKerja->proposals->map(fn (ProposalProgramKerja $proposal) => [
                    'id' => $proposal->id,
                    'file_name' => $proposal->file_name,
                    'version' => $proposal->version,
                    'uploaded_at' => $proposal->uploaded_at?->toIso8601String(),
                    'download_url' => route('student.program-kerja.proposals.download', [
                        'programKerja' => $programKerja->id,
                        'proposal' => $proposal->id,
                    ]),
                ])->values()->all(),
            ],
        ]);
    }

    public function uploadProposal(Request $request, ProgramKerja $programKerja): RedirectResponse
    {
        $this->authorizeProgramAccess($programKerja);

        $validated = $request->validate([
            'proposal_file' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:4096'],
        ]);

        /** @var UploadedFile $proposalFile */
        $proposalFile = $validated['proposal_file'];
        $this->createProposalRecord($programKerja, $proposalFile);

        return redirect()->route('student.program-kerja.show', $programKerja)
            ->with('success', 'Proposal program kerja berhasil diunggah.');
    }

    public function downloadProposal(ProgramKerja $programKerja, ProposalProgramKerja $proposal): BinaryFileResponse
    {
        $this->authorizeProgramAccess($programKerja);
        abort_unless($proposal->program_kerja_id === $programKerja->id, 404);

        $disk = Storage::disk('public');
        abort_unless($disk->exists($proposal->file_path), 404, 'File proposal tidak ditemukan.');

        return response()->download($disk->path($proposal->file_path), $proposal->file_name);
    }
}
