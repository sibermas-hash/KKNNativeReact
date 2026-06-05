<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Exports\RekapNilaiExport;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\NilaiKknResource;
use App\Http\Traits\ApiResponse;
use App\Jobs\GenerateMassCertificatesJob;
use App\Models\KKN\BimbinganSession;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\Periode;
use App\Services\CertificateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class RekapNilaiController extends Controller
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
            $query->whereHas('user.mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
        }
    }

    private function ensureScoreInFacultyScope(NilaiKkn $score): void
    {
        if ($facultyId = $this->facultyScopeId()) {
            $score->loadMissing('user.mahasiswa');
            abort_unless($score->user?->mahasiswa?->fakultas_id === $facultyId, 403, 'Anda tidak memiliki akses ke nilai ini.');
        }
    }

    public function index(Request $request): JsonResponse
    {
        $query = NilaiKkn::with(['user', 'kelompok.periode'])->when($request->input('periode_id'), fn ($q, $id) => $q->whereHas('kelompok', fn ($q2) => $q2->where('periode_id', $id)))->when($request->input('kelompok_id'), fn ($q, $id) => $q->where('kelompok_id', $id))->orderByDesc('created_at');
        $this->scopeByFaculty($query);

        return $this->successCollection(NilaiKknResource::collection($query->paginate(25)));
    }

    public function finalize(NilaiKkn $score): JsonResponse
    {
        $this->ensureScoreInFacultyScope($score);

        if ($deny = $this->enforceBimbinganRequirement($score)) {
            return $deny;
        }

        // G-08 fix: recalc before finalization to ensure total_score is current
        app(\App\Services\GradingService::class)->calculateFinalGrade($score);
        $score->refresh();

        $score->update(['is_finalized' => true, 'admin_graded_by' => auth()->id(), 'admin_graded_at' => now()]);

        return $this->success(new NilaiKknResource($score->refresh()), 'Nilai berhasil difinalisasi.');
    }

    public function finalizeMass(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
            'periode_id' => ['required', 'integer', 'exists:periode,id'],
        ]);

        $scoresQuery = NilaiKkn::whereIn('id', $request->input('ids'))
            ->whereHas('kelompok', fn ($q) => $q->where('periode_id', $request->input('periode_id')))
            ->with('kelompok');
        $this->scopeByFaculty($scoresQuery);
        $scores = $scoresQuery->get();

        $force = (bool) $request->boolean('force');
        $isSuperadmin = (bool) auth()->user()?->hasRole('superadmin');
        $finalized = 0;
        $skipped = [];

        foreach ($scores as $score) {
            if (! ($force && $isSuperadmin)) {
                $err = $this->enforceBimbinganRequirement($score);
                if ($err !== null) {
                    $skipped[] = [
                        'id' => $score->id,
                        'reason' => 'Bimbingan minimum belum terpenuhi',
                    ];

                    continue;
                }
            }
            $score->update(['is_finalized' => true, 'admin_graded_by' => auth()->id(), 'admin_graded_at' => now()]);
            $finalized++;
        }

        return $this->success(
            ['finalized_count' => $finalized, 'skipped_count' => count($skipped), 'skipped' => $skipped],
            "{$finalized} nilai berhasil difinalisasi.".(count($skipped) ? ' '.count($skipped).' dilewati (bimbingan kurang).' : ''),
        );
    }

    /**
     * Cek kelompok sudah punya min 4 sesi bimbingan completed.
     * Return JsonResponse 422 kalau belum, null kalau sudah atau bisa di-bypass.
     */
    private function enforceBimbinganRequirement(NilaiKkn $score): ?JsonResponse
    {
        $kelompokId = $score->kelompok_id;
        if (! $kelompokId) {
            return null; // no kelompok → grading scenario edge, skip guard
        }

        $completedCount = BimbinganSession::where('kelompok_id', $kelompokId)
            ->where('status', 'completed')
            ->count();

        $required = BimbinganSession::MIN_SESSIONS_REQUIRED;

        if ($completedCount < $required) {
            return $this->error(
                'VALIDATION_ERROR',
                "Finalisasi nilai ditolak. Kelompok baru punya {$completedCount} sesi bimbingan (minimum {$required}). DPL harus menyelesaikan bimbingan + notulensi terlebih dahulu.",
                422,
            );
        }

        return null;
    }

    public function export(Request $request)
    {
        $periodeId = $request->input('periode_id');

        $scoresQuery = NilaiKkn::with(['user', 'kelompok.periode', 'kelompok.lokasi'])
            ->when($periodeId, fn ($q, $id) => $q->whereHas('kelompok', fn ($q2) => $q2->where('periode_id', $id)))
            ->where('is_finalized', true)
            ->orderBy('created_at');
        $this->scopeByFaculty($scoresQuery);
        $scores = $scoresQuery->get();

        $periode = $periodeId ? Periode::find($periodeId) : null;

        return Excel::download(
            new RekapNilaiExport($scores, $periode),
            'Rekap_Nilai_KKN_'.now()->format('Ymd').'.xlsx'
        );
    }

    public function getCertificateProgress(Request $request): JsonResponse
    {
        $periodeId = $request->input('periode_id');

        $totalQuery = NilaiKkn::when($periodeId, fn ($q, $id) => $q->whereHas('kelompok', fn ($q2) => $q2->where('periode_id', $id)))
            ->whereNotNull('total_score');
        $this->scopeByFaculty($totalQuery);
        $total = $totalQuery->count();

        $withCertQuery = NilaiKkn::when($periodeId, fn ($q, $id) => $q->whereHas('kelompok', fn ($q2) => $q2->where('periode_id', $id)))
            ->where('is_finalized', true);
        $this->scopeByFaculty($withCertQuery);
        $withCert = $withCertQuery->count();

        $progress = $total > 0 ? round(($withCert / $total) * 100, 1) : 0;

        return $this->success([
            'total' => $total,
            'with_cert' => $withCert,
            'progress_pct' => $progress,
        ]);
    }

    public function downloadWordCertificate(NilaiKkn $score)
    {
        $this->ensureScoreInFacultyScope($score);
        abort_unless($score->is_finalized, 422, 'Nilai belum difinalisasi. Sertifikat belum dapat diterbitkan.');

        $tempFile = app(CertificateService::class)->generateWordForStudent($score);
        $userName = $score->relationLoaded('user') ? ($score->user->name ?? '') : '';
        $name = 'Sertifikat_KKN_'.($userName ?: $score->user_id).'.docx';

        return response()->download($tempFile, $name)->deleteFileAfterSend(true);
    }

    /**
     * Download sertifikat PDF.
     */
    public function downloadCertificate(NilaiKkn $score)
    {
        $this->ensureScoreInFacultyScope($score);
        abort_unless($score->is_finalized, 422, 'Nilai belum difinalisasi.');

        // Authorization: Student can only download their own, DPL can only download their group's students
        $user = auth()->user();
        if ($user->hasRole('student')) {
            abort_if($user->id !== $score->user_id, 403, 'Anda tidak memiliki akses ke sertifikat ini.');
        } elseif ($user->hasRole('dpl')) {
            $dosen = $user->dosen;
            abort_if(! $dosen, 403, 'Data dosen tidak ditemukan.');
            $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');
            abort_if(! $groupIds->contains($score->kelompok_id), 403, 'Anda tidak memiliki akses ke sertifikat ini.');
        }

        $pdf = app(CertificateService::class)->generateForStudent($score);
        $userName = $score->relationLoaded('user') ? ($score->user->name ?? '') : '';
        $name = 'Sertifikat_KKN_'.($userName ?: $score->user_id).'.pdf';

        return $pdf->download($name);
    }

    public function downloadMass(Request $request)
    {
        $validated = $request->validate([
            'periode_id' => ['required', 'exists:periode,id'],
            'kelompok_id' => ['nullable', 'exists:kelompok_kkn,id'],
        ]);

        $query = NilaiKkn::with(['user', 'kelompok'])
            ->whereHas('kelompok', fn ($q) => $q->where('periode_id', $validated['periode_id']))
            ->where('is_finalized', true);

        if (! empty($validated['kelompok_id'])) {
            $query->where('kelompok_id', $validated['kelompok_id']);
        }

        $this->scopeByFaculty($query);
        $scores = $query->get();

        abort_if($scores->isEmpty(), 404, 'Tidak ada sertifikat yang sudah difinalisasi.');

        return app(CertificateService::class)->generateZip($scores);
    }

    public function previewCertificate(NilaiKkn $score)
    {
        $this->ensureScoreInFacultyScope($score);
        abort_unless($score->is_finalized, 422, 'Nilai belum difinalisasi.');

        return app(CertificateService::class)->preview($score);
    }

    /**
     * Progress finalisasi massal (polling endpoint).
     */
    /**
     * Download ZIP semua sertifikat dalam satu periode.
     */
    public function bulkDownload(Request $request)
    {
        $periodeId = $request->validate(['periode_id' => ['required', 'exists:periode,id']])['periode_id'];

        $scoresQuery = NilaiKkn::with(['user', 'kelompok'])
            ->whereHas('kelompok', fn ($q) => $q->where('periode_id', $periodeId))
            ->where('is_finalized', true);
        $this->scopeByFaculty($scoresQuery);
        $scores = $scoresQuery->get();

        abort_if($scores->isEmpty(), 404, 'Tidak ada sertifikat yang sudah difinalisasi.');

        return app(CertificateService::class)->generateZip($scores);
    }

    public function getFinalizeProgress(Request $request): JsonResponse
    {
        $periodeId = $request->input('periode_id');

        $totalQuery = NilaiKkn::when($periodeId, fn ($q, $id) => $q->whereHas('kelompok', fn ($q2) => $q2->where('periode_id', $id)));
        $this->scopeByFaculty($totalQuery);
        $total = $totalQuery->count();

        $finalizedQuery = NilaiKkn::when($periodeId, fn ($q, $id) => $q->whereHas('kelompok', fn ($q2) => $q2->where('periode_id', $id)))
            ->where('is_finalized', true);
        $this->scopeByFaculty($finalizedQuery);
        $finalized = $finalizedQuery->count();

        return $this->success([
            'total' => $total,
            'finalized' => $finalized,
            'remaining' => $total - $finalized,
            'percentage' => $total > 0 ? round(($finalized / $total) * 100, 1) : 0,
        ]);
    }

    /**
     * Generate sertifikat massal (dispatch job).
     */
    public function bulkCertificates(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'periode_id' => ['required', 'exists:periode,id'],
            'ids' => ['nullable', 'array'],
            'ids.*' => ['integer'],
        ]);

        $query = NilaiKkn::where('is_finalized', true)
            ->whereHas('kelompok', fn ($q) => $q->where('periode_id', $validated['periode_id']));
        $this->scopeByFaculty($query);

        if (! empty($validated['ids'])) {
            $query->whereIn('id', $validated['ids']);
        }

        $count = $query->count();

        if ($count === 0) {
            return $this->error('VALIDATION_ERROR', 'Tidak ada nilai yang sudah difinalisasi.', 422);
        }

        GenerateMassCertificatesJob::dispatch(
            (int) $validated['periode_id'],
            [
                'ids' => $validated['ids'] ?? [],
                'fakultas_id' => $this->facultyScopeId(),
            ],
            auth()->id()
        );

        return $this->success(['queued' => $count], "{$count} sertifikat sedang diproses.");
    }

    /**
     * Export ledger nilai (Excel).
     */
    public function exportLedger(Request $request)
    {
        $periodeId = $request->input('periode_id');

        $scoresQuery = NilaiKkn::with(['user', 'kelompok.periode', 'kelompok.lokasi'])
            ->when($periodeId, fn ($q, $id) => $q->whereHas('kelompok', fn ($q2) => $q2->where('periode_id', $id)))
            ->where('is_finalized', true)
            ->orderBy('created_at');
        $this->scopeByFaculty($scoresQuery);
        $scores = $scoresQuery->get();

        $periode = $periodeId
            ? Periode::find($periodeId)
            : null;

        return Excel::download(
            new RekapNilaiExport($scores, $periode),
            'Ledger_Nilai_KKN_'.now()->format('Ymd').'.xlsx'
        );
    }
}
