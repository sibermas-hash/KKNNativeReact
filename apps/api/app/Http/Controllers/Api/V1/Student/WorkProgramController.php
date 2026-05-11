<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ProgramKerjaResource;
use App\Http\Resources\Api\V1\ProposalProgramKerjaResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\ProgramKerja;
use App\Models\KKN\ProposalProgramKerja;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class WorkProgramController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        /** @var \App\Models\User|null $user */
        $user = auth()->user();
        $mahasiswa = $user?->mahasiswa;
        $registration = $mahasiswa?->peserta()->where('status', 'approved')->first();

        if (! $registration?->kelompok_id) {
            return $this->success(['programs' => []]);
        }

        $programs = ProgramKerja::where('kelompok_id', $registration->kelompok_id)
            ->with(['proposals'])
            ->orderByDesc('created_at')
            ->get();

        return $this->success([
            'programs' => ProgramKerjaResource::collection($programs),
        ]);
    }

    public function show(ProgramKerja $programKerja): JsonResponse
    {
        Gate::authorize('view', $programKerja);
        $programKerja->load(['proposals', 'kelompok']);

        return $this->success(new ProgramKerjaResource($programKerja));
    }

    public function store(Request $request): JsonResponse
    {
        /** @var \App\Models\User|null $user */
        $user = auth()->user();
        $mahasiswa = $user?->mahasiswa;
        $registration = $mahasiswa?->peserta()->where('status', 'approved')->first();

        if (! $registration?->kelompok_id) {
            return $this->forbidden('Anda belum ditempatkan di kelompok.');
        }

        if (strtolower((string) $registration->role) !== 'ketua') {
            return $this->forbidden('Hanya ketua kelompok yang dapat membuat program kerja.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'sdg_goals' => ['nullable', 'array'],
            'objectives' => ['nullable', 'string'],
            'target_participants' => ['nullable', 'integer', 'min:1'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'kategori' => ['nullable', 'string', 'max:100'],
        ]);

        $program = ProgramKerja::create([
            'kelompok_id' => $registration->kelompok_id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'sdg_goals' => $validated['sdg_goals'] ?? null,
            'objectives' => $validated['objectives'] ?? null,
            'target_participants' => $validated['target_participants'] ?? null,
            'budget' => $validated['budget'] ?? null,
            'kategori' => $validated['kategori'] ?? null,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        return $this->created(
            new ProgramKerjaResource($program),
            'Program kerja berhasil dibuat.'
        );
    }

    public function uploadProposal(Request $request, ProgramKerja $programKerja): JsonResponse
    {
        Gate::authorize('update', $programKerja);

        /** @var \App\Models\User|null $user */
        $user = auth()->user();
        $mahasiswa = $user?->mahasiswa;
        $registration = $mahasiswa?->peserta()->where('status', 'approved')->first();

        if (strtolower((string) $registration?->role) !== 'ketua') {
            return $this->forbidden('Hanya ketua kelompok yang dapat mengunggah proposal.');
        }

        $request->validate([
            'proposal' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:10240'],
        ]);

        $file = $request->file('proposal');
        $path = $file->store('proposals', config('filesystems.default'));

        $latestVersion = ProposalProgramKerja::where('program_kerja_id', $programKerja->id)->max('version') ?? 0;

        $proposal = ProposalProgramKerja::create([
            'program_kerja_id' => $programKerja->id,
            'version' => $latestVersion + 1,
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'uploaded_at' => now(),
        ]);

        return $this->created(
            new ProposalProgramKerjaResource($proposal),
            'Proposal berhasil diunggah.'
        );
    }

    public function downloadProposal(ProgramKerja $programKerja, ProposalProgramKerja $proposal): JsonResponse
    {
        Gate::authorize('view', $programKerja);

        // Verify proposal belongs to this program (prevent IDOR)
        if ($proposal->program_kerja_id !== $programKerja->id) {
            return $this->notFound('Proposal tidak ditemukan untuk program kerja ini.');
        }

        if (! Storage::disk(config('filesystems.default'))->exists($proposal->file_path)) {
            return $this->notFound('File proposal tidak ditemukan.');
        }

        return $this->success([
            'download_url' => Storage::disk(config('filesystems.default'))->url($proposal->file_path),
            'file_name' => $proposal->file_name,
        ]);
    }
}
