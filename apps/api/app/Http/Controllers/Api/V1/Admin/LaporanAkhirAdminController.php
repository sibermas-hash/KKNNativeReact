<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\LaporanAkhirResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\LaporanAkhir;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LaporanAkhirAdminController extends Controller
{
    use ApiResponse;

    private function facultyScopeId(): ?int
    {
        $user = auth()->user();

        return $user?->hasRole('faculty_admin') && $user->fakultas_id
            ? (int) $user->fakultas_id
            : null;
    }

    private function scopeByFaculty($query): void
    {
        if ($facultyId = $this->facultyScopeId()) {
            $query->whereHas('mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
        }
    }

    private function ensureReportInFacultyScope(LaporanAkhir $report): void
    {
        $report->loadMissing('kelompok.periode');
        abort_unless($report->kelompok?->periode?->is_active, 404, 'Laporan akhir ini bukan periode aktif.');

        if ($facultyId = $this->facultyScopeId()) {
            $report->loadMissing('mahasiswa');
            abort_unless($report->mahasiswa?->fakultas_id === $facultyId, 403, 'Anda tidak memiliki akses ke laporan ini.');
        }
    }

    public function index(Request $request): JsonResponse
    {
        $query = LaporanAkhir::with(['mahasiswa.user', 'kelompok.periode'])
            ->whereHas('kelompok.periode', fn ($q) => $q->where('is_active', true))
            ->when($request->input('kelompok_id'), fn ($q, $id) => $q->where('kelompok_id', $id))
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = '%'.strtolower(trim((string) $request->input('search'))).'%';
                $q->where(function ($qq) use ($search) {
                    $qq->whereRaw('lower(title) like ?', [$search])
                        ->orWhereHas('mahasiswa', fn ($m) => $m->whereRaw('lower(nama) like ?', [$search])->orWhereRaw('lower(nim) like ?', [$search]))
                        ->orWhereHas('kelompok', fn ($g) => $g->whereRaw('lower(nama_kelompok) like ?', [$search])->orWhereRaw('lower(code) like ?', [$search]));
                });
            })
            ->orderByDesc('submitted_at');

        $this->scopeByFaculty($query);

        return $this->successCollection(LaporanAkhirResource::collection($query->paginate(25)));
    }

    public function show(LaporanAkhir $report): JsonResponse
    {
        $this->ensureReportInFacultyScope($report);
        $report->load(['mahasiswa.user', 'kelompok.periode']);

        return $this->success(new LaporanAkhirResource($report));
    }

    public function updateStatus(Request $request, LaporanAkhir $report): JsonResponse
    {
        $this->ensureReportInFacultyScope($report);
        $request->validate([
            'status' => ['required', 'string', 'in:approved,revision'],
            'review_notes' => ['required_if:status,revision', 'nullable', 'string', 'min:10'],
        ]);
        $report->update(['status' => $request->input('status'), 'reviewed_by' => auth()->id(), 'reviewed_at' => now(), 'review_notes' => $request->input('review_notes')]);

        return $this->success(new LaporanAkhirResource($report->refresh()), 'Status laporan diperbarui.');
    }

    public function download(Request $request, LaporanAkhir $report)
    {
        $this->ensureReportInFacultyScope($report);
        $asset = $request->input('asset');
        $allowedPaths = collect([
            $report->file_path,
            $report->article_1_path,
            $report->article_2_path,
            $report->poster_1_path,
            $report->poster_2_path,
            $report->poster_3_path,
        ])->filter()->values();

        $path = $asset && $allowedPaths->contains($asset) ? $asset : $report->file_path;

        abort_if(! $path || ! Storage::exists($path), 404, 'File laporan tidak ditemukan.');

        return Storage::download($path, basename($path));
    }
}
