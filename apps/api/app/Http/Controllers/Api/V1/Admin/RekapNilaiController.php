<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\NilaiKknResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\NilaiKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RekapNilaiController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = NilaiKkn::with(['user', 'kelompok.periode'])->when($request->input('periode_id'), fn ($q, $id) => $q->whereHas('kelompok', fn ($q2) => $q2->where('periode_id', $id)))->when($request->input('kelompok_id'), fn ($q, $id) => $q->where('kelompok_id', $id))->orderByDesc('created_at');
        return $this->successCollection(NilaiKknResource::collection($query->paginate(25)));
    }

    public function finalize(NilaiKkn $score): JsonResponse
    {
        // Audit R11-REGULER-016 fix: pastikan kelompok sudah punya min 4 sesi
        // bimbingan 'completed' sebelum nilai difinalisasi. Superadmin bisa
        // bypass dengan ?force=1 untuk kasus edge (DPL gagal input karena IT issue).
        if ($deny = $this->enforceBimbinganRequirement($score)) {
            return $deny;
        }

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

        $scores = NilaiKkn::whereIn('id', $request->input('ids'))
            ->whereHas('kelompok', fn ($q) => $q->where('periode_id', $request->input('periode_id')))
            ->with('kelompok')
            ->get();

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
            "{$finalized} nilai berhasil difinalisasi." . (count($skipped) ? ' ' . count($skipped) . ' dilewati (bimbingan kurang).' : ''),
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

        $completedCount = \App\Models\KKN\BimbinganSession::where('kelompok_id', $kelompokId)
            ->where('status', 'completed')
            ->count();

        $required = \App\Models\KKN\BimbinganSession::MIN_SESSIONS_REQUIRED;

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

        $scores = NilaiKkn::with(['user', 'kelompok.periode', 'kelompok.lokasi'])
            ->when($periodeId, fn ($q, $id) => $q->whereHas('kelompok', fn ($q2) => $q2->where('periode_id', $id)))
            ->where('is_finalized', true)
            ->orderBy('created_at')
            ->get();

        $periode = $periodeId ? \App\Models\KKN\Periode::find($periodeId) : null;

        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\RekapNilaiExport($scores, $periode),
            'Rekap_Nilai_KKN_' . now()->format('Ymd') . '.xlsx'
        );
    }

    public function getCertificateProgress(Request $request): JsonResponse
    {
        $periodeId = $request->input('periode_id');

        $total = NilaiKkn::when($periodeId, fn ($q, $id) => $q->whereHas('kelompok', fn ($q2) => $q2->where('periode_id', $id)))
            ->whereNotNull('total_score')
            ->count();

        $withCert = NilaiKkn::when($periodeId, fn ($q, $id) => $q->whereHas('kelompok', fn ($q2) => $q2->where('periode_id', $id)))
            ->where('is_finalized', true)
            ->count();

        $progress = $total > 0 ? round(($withCert / $total) * 100, 1) : 0;

        return $this->success([
            'total'        => $total,
            'with_cert'    => $withCert,
            'progress_pct' => $progress,
        ]);
    }

    public function downloadWordCertificate(NilaiKkn $score)
    {
        abort_unless($score->is_finalized, 422, 'Nilai belum difinalisasi. Sertifikat belum dapat diterbitkan.');

        return app(\App\Services\CertificateService::class)->generateWordForStudent($score);
    }

    /**
     * Download sertifikat PDF.
     */
    public function downloadCertificate(NilaiKkn $score)
    {
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

        $pdf = app(\App\Services\CertificateService::class)->generateForStudent($score);
        $name = 'Sertifikat_KKN_' . ($score->user?->name ?? $score->user_id) . '.pdf';

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

        $scores = $query->get();

        abort_if($scores->isEmpty(), 404, 'Tidak ada sertifikat yang sudah difinalisasi.');

        return app(\App\Services\CertificateService::class)->generateZip($scores);
    }

    public function previewCertificate(NilaiKkn $score)
    {
        abort_unless($score->is_finalized, 422, 'Nilai belum difinalisasi.');

        return app(\App\Services\CertificateService::class)->preview($score);
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

        $scores = NilaiKkn::with(['user', 'kelompok'])
            ->whereHas('kelompok', fn ($q) => $q->where('periode_id', $periodeId))
            ->where('is_finalized', true)
            ->get();

        abort_if($scores->isEmpty(), 404, 'Tidak ada sertifikat yang sudah difinalisasi.');

        return app(\App\Services\CertificateService::class)->generateZip($scores);
    }

    public function getFinalizeProgress(Request $request): JsonResponse
    {
        $periodeId = $request->input('periode_id');

        $total = NilaiKkn::when($periodeId, fn ($q, $id) => $q->whereHas('kelompok', fn ($q2) => $q2->where('periode_id', $id)))
            ->count();

        $finalized = NilaiKkn::when($periodeId, fn ($q, $id) => $q->whereHas('kelompok', fn ($q2) => $q2->where('periode_id', $id)))
            ->where('is_finalized', true)
            ->count();

        return $this->success([
            'total'      => $total,
            'finalized'  => $finalized,
            'remaining'  => $total - $finalized,
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

        if (! empty($validated['ids'])) {
            $query->whereIn('id', $validated['ids']);
        }

        $count = $query->count();

        if ($count === 0) {
            return $this->error('VALIDATION_ERROR', 'Tidak ada nilai yang sudah difinalisasi.', 422);
        }

        \App\Jobs\GenerateMassCertificatesJob::dispatch(
            (int) $validated['periode_id'],
            ['ids' => $validated['ids'] ?? []],
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

        $scores = NilaiKkn::with(['user', 'kelompok.periode', 'kelompok.lokasi'])
            ->when($periodeId, fn ($q, $id) => $q->whereHas('kelompok', fn ($q2) => $q2->where('periode_id', $id)))
            ->where('is_finalized', true)
            ->orderBy('created_at')
            ->get();

        $periode = $periodeId
            ? \App\Models\KKN\Periode::find($periodeId)
            : null;

        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\RekapNilaiExport($scores, $periode),
            'Ledger_Nilai_KKN_' . now()->format('Ymd') . '.xlsx'
        );
    }
}
