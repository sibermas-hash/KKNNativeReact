<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Exports\GradesExport;
use App\Exports\RekapNilaiExport;
use App\Http\Controllers\Controller;
use App\Jobs\GenerateMassCertificatesJob;
use App\Models\KKN\Fakultas;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\Periode;
use App\Notifications\KknActivityNotification;
use App\Repositories\KknScoreRepository;
use App\Services\CertificateService;
use App\Services\GradingService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class RekapNilaiController extends Controller
{
    public function __construct(
        private KknScoreRepository $repo,
        private GradingService $grading,
        private CertificateService $certificate,
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $this->authorize('viewAny', NilaiKkn::class);

        $activePeriod = Periode::getActivePeriod();
        $periods = Periode::query()
            ->orderByDesc('start_date')
            ->orderByDesc('id')
            ->get(['id', 'name']);
        $periodeId = $request->integer('periode_id', $activePeriod?->id ?? $periods->first()?->id);

        $facultyScopeId = $user->hasRole('faculty_admin')
            ? ($user->fakultas_id ?: -1)
            : $request->integer('fakultas_id');

        $filters = [
            'search' => $request->string('search')->toString() ?: null,
            'periode_id' => $periodeId,
            'fakultas_id' => $facultyScopeId,
            'kelompok_id' => $request->integer('kelompok_id'),
            'huruf' => $request->string('huruf')->toString() ?: null,
        ];

        if (! $periodeId) {
            return Inertia::render('Admin/Academic/GradeReports/Index', [
                'scores' => [],
                'stats' => null,
                'filters' => $filters,
                'periodeId' => null,
                'periods' => $periods,
                'faculties' => [],
                'lockedFaculty' => $this->lockedFacultyPayload($user),
                'canExport' => Gate::forUser($user)->allows('export', NilaiKkn::class),
                'canBulkCertificates' => Gate::forUser($user)->allows('export', NilaiKkn::class),
                'canFinalizeMass' => Gate::forUser($user)->allows('bulkFinalize', NilaiKkn::class),
            ]);
        }

        $rows = $this->repo->getRekapNilai($periodeId, $filters);

        return Inertia::render('Admin/Academic/GradeReports/Index', [
            'scores' => $this->transformRows($rows),
            'stats' => [
                'total_students' => $rows->count(),
                'graded_count' => $rows->whereNotNull('nilai_akhir')->count(),
                'locked_count' => $rows->where('is_finalized', true)->count(),
                'average_value' => round((float) ($rows->avg('nilai_akhir') ?? 0), 1),
            ],
            'filters' => $filters,
            'periodeId' => $periodeId,
            'periods' => $periods,
            'faculties' => $user->hasRole('faculty_admin')
                ? []
                : Fakultas::select('id', 'nama as name')->orderBy('nama')->get(),
            'lockedFaculty' => $this->lockedFacultyPayload($user),
            'canExport' => Gate::forUser($user)->allows('export', NilaiKkn::class),
            'canBulkCertificates' => Gate::forUser($user)->allows('export', NilaiKkn::class),
            'canFinalizeMass' => Gate::forUser($user)->allows('bulkFinalize', NilaiKkn::class),
        ]);
    }

    public function export(Request $request)
    {
        $this->authorize('export', NilaiKkn::class);

        $periodeId = $this->resolveRequestedPeriodId($request);

        if (! $periodeId) {
            return back()->with('error', 'Pilih periode terlebih dahulu sebelum mengekspor rekap nilai.');
        }

        $rows = $this->repo->getRekapNilai($periodeId, [
            'fakultas_id' => $request->input('fakultas_id'),
            'kelompok_id' => $request->input('kelompok_id'),
            'search' => $request->input('search'),
            'huruf' => $request->input('huruf'),
        ]);
        $periode = Periode::find($periodeId);

        if (! $periode) {
            return back()->with('error', 'Periode rekap nilai tidak ditemukan.');
        }

        return Excel::download(
            new RekapNilaiExport($rows, $periode),
            "Rekap_Nilai_KKN_{$periode->name}_".now()->format('Ymd').'.xlsx'
        );
    }

    public function finalizeMass(Request $request)
    {
        $this->authorize('bulkFinalize', NilaiKkn::class);

        $validated = $request->validate([
            'periode_id' => 'required|exists:periode,id',
        ]);

        $this->grading->dispatchMassFinalization($validated['periode_id']);

        return back()->with('info', 'Proses finalisasi massal telah dimulai di latar belakang.');
    }

    public function finalize(NilaiKkn $score)
    {
        $this->authorize('finalize', $score);

        $score->loadMissing('mahasiswa.user');

        if ($score->is_finalized) {
            return back()->with('info', 'Nilai mahasiswa ini sudah difinalisasi.');
        }

        if (is_null($score->total_score)) {
            return back()->with('error', 'Nilai akhir belum lengkap dan belum dapat difinalisasi.');
        }

        if (! $score->mahasiswa) {
            return back()->with('error', 'Data mahasiswa untuk nilai ini tidak ditemukan.');
        }

        $reportApproved = LaporanAkhir::where('mahasiswa_id', $score->mahasiswa->id)
            ->where('kelompok_id', $score->kelompok_id)
            ->where('status', 'approved')
            ->exists();

        if (! $reportApproved) {
            return back()->with('error', 'Laporan akhir mahasiswa belum disetujui, sehingga nilai belum dapat difinalisasi.');
        }

        $score->update(['is_finalized' => true]);

        if ($score->mahasiswa?->user) {
            $score->mahasiswa->user->notify(new KknActivityNotification([
                'type' => 'success',
                'title' => 'Nilai KKN Difinalisasi',
                'message' => 'Nilai KKN Anda telah difinalisasi oleh Admin LPPM. Silakan unduh sertifikat.',
                'icon' => 'academic-cap',
                'action' => route('student.dashboard'),
            ]));
        }

        return back()->with('success', 'Nilai mahasiswa berhasil difinalisasi.');
    }

    public function getFinalizeProgress(Request $request)
    {
        $this->authorize('bulkFinalize', NilaiKkn::class);
        $periodId = $request->integer('periode_id');

        $progress = Cache::get("finalize_progress_{$periodId}");

        return response()->json($progress);
    }

    public function downloadCertificate(NilaiKkn $score)
    {
        $this->authorize('view', $score);

        if (! $score->is_finalized) {
            return back()->with('error', 'Sertifikat hanya tersedia untuk nilai yang sudah difinalisasi.');
        }

        $pdf = $this->certificate->generateForStudent($score);
        $nim = $score->mahasiswa->nim ?? '';
        $filename = "Sertifikat_KKN_{$score->mahasiswa->nama}_{$nim}.pdf";

        return $pdf->download($filename);
    }

    /**
     * Download certificate in Word format (.docx)
     */
    public function downloadWordCertificate(NilaiKkn $score)
    {
        $this->authorize('view', $score);

        if (! $score->is_finalized) {
            return back()->with('error', 'Sertifikat hanya tersedia untuk nilai yang sudah difinalisasi.');
        }

        try {
            $filePath = $this->certificate->generateWordForStudent($score);
            $nim = $score->mahasiswa->nim ?? '';
            $filename = "Sertifikat_KKN_{$score->mahasiswa->nama}_{$nim}.docx";

            return response()->download($filePath, $filename)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Fast preview for the dashboard (Base64 PDF)
     */
    public function previewCertificate(NilaiKkn $score)
    {
        $this->authorize('view', $score);
        
        try {
            $base64 = $this->certificate->preview($score);
            return response()->json([
                'success' => true,
                'preview' => $base64,
                'filename' => "Preview_Sertifikat_{$score->mahasiswa->nim}.pdf"
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function bulkCertificates(Request $request)
    {
        $this->authorize('export', NilaiKkn::class);

        $periodeId = $request->integer('periode_id');
        $filters = $request->only(['fakultas_id', 'kelompok_id']);

        GenerateMassCertificatesJob::dispatch(
            $periodeId,
            $filters,
            auth()->id()
        );

        return back()->with('info', 'Proses pembuatan sertifikat massal telah dimulai di latar belakang. Anda akan menerima notifikasi jika sudah selesai.');
    }

    public function getCertificateProgress(Request $request)
    {
        $this->authorize('export', NilaiKkn::class);
        $periodId = $request->integer('periode_id');
        $adminId = auth()->id();

        $cacheKey = "cert_progress_{$periodId}_{$adminId}";
        $progress = Cache::get($cacheKey);

        return response()->json($progress);
    }

    private const ALLOWED_SCORE_COMPONENTS = [
        'final_report_score',
        'execution_score',
        'article_score',
        'discipline_score',
        'attitude_score',
        'administration_score',
        'dpl_score_1',
    ];

    public function saveInline(Request $request)
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer'],
            'kelompok_id' => ['required', 'integer'],
            'component' => ['required', 'string', 'in:'.implode(',', self::ALLOWED_SCORE_COMPONENTS)],
            'value' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        // Authorize against the specific score record (not just the class)
        $existingScore = NilaiKkn::where('user_id', $validated['user_id'])
            ->where('kelompok_id', $validated['kelompok_id'])
            ->first();

        if ($existingScore) {
            $this->authorize('update', $existingScore);
        } else {
            $this->authorize('create', NilaiKkn::class);
        }

        $score = $this->grading->updateUnifiedScore(
            $validated['user_id'],
            $validated['kelompok_id'],
            [$validated['component'] => $validated['value']],
            auth()->id()
        );

        return response()->json([
            'success' => true,
            'score' => $score,
            'message' => 'Nilai berhasil diperbarui.',
        ]);
    }

    private function transformRows(Collection $rows): array
    {
        return $rows->map(function ($row) {
            return [
                'id' => $row->score_id ? (int) $row->score_id : (int) $row->mahasiswa_id,
                'score_id' => $row->score_id ? (int) $row->score_id : null,
                'student_id' => (int) $row->mahasiswa_id,
                'kelompok_id' => (int) $row->kelompok_id,
                'nim' => $row->nim,
                'name' => $row->nama,
                'group_name' => $row->group_name,
                'final_grade_value' => $row->nilai_akhir,
                'final_grade_letter' => $row->huruf,
                'is_locked' => (bool) $row->is_finalized,
                'prodi' => $row->prodi,
                'fakultas' => $row->fakultas,
                'can_finalize' => $row->score_id !== null && $row->nilai_akhir !== null,
            ];
        })->values()->all();
    }

    private function lockedFacultyPayload($user): ?array
    {
        if (! $user->hasRole('faculty_admin') || ! $user->fakultas) {
            return null;
        }

        return [
            'id' => $user->fakultas->id,
            'name' => $user->fakultas->nama,
        ];
    }

    /**
     * Bulk lock scores for a period
     */
    public function bulkLock(Request $request)
    {
        $this->authorize('bulkFinalize', NilaiKkn::class);

        $validated = $request->validate([
            'periode_id' => 'required|exists:periode,id',
            'fakultas_id' => 'nullable|exists:fakultas,id',
        ]);

        $query = NilaiKkn::whereHas('kelompok', function ($q) use ($validated) {
            $q->where('periode_id', $validated['periode_id']);
        })->whereNull('admin_locked_at');

        if ($validated['fakultas_id']) {
            $query->whereHas('mahasiswa', function ($q) use ($validated) {
                $q->where('fakultas_id', $validated['fakultas_id']);
            });
        }

        $count = $query->update(['admin_locked_at' => now(), 'admin_locked_by' => auth()->id()]);

        return back()->with('success', "{$count} nilai berhasil dikunci.");
    }

    /**
     * Bulk unlock scores for a period
     */
    public function bulkUnlock(Request $request)
    {
        $this->authorize('bulkFinalize', NilaiKkn::class);

        $validated = $request->validate([
            'periode_id' => 'required|exists:periode,id',
            'fakultas_id' => 'nullable|exists:fakultas,id',
        ]);

        $query = NilaiKkn::whereHas('kelompok', function ($q) use ($validated) {
            $q->where('periode_id', $validated['periode_id']);
        })->whereNotNull('admin_locked_at');

        if ($validated['fakultas_id']) {
            $query->whereHas('mahasiswa', function ($q) use ($validated) {
                $q->where('fakultas_id', $validated['fakultas_id']);
            });
        }

        $count = $query->update(['admin_locked_at' => null, 'admin_locked_by' => null]);

        return back()->with('success', "{$count} nilai berhasil dibuka kuncinya.");
    }

    /**
     * Export ledger/summary nilai ke Excel
     */
    public function exportLedger(Request $request)
    {
        $this->authorize('export', NilaiKkn::class);

        $periodeId = $this->resolveRequestedPeriodId($request);

        if (! $periodeId) {
            return back()->with('error', 'Pilih periode terlebih dahulu sebelum mengekspor ledger nilai.');
        }

        $periode = Periode::find($periodeId);

        if (! $periode) {
            return back()->with('error', 'Periode rekap nilai tidak ditemukan.');
        }

        return Excel::download(
            new GradesExport($periodeId),
            "Ledger_Nilai_KKN_{$periode->name}_".now()->format('Ymd_His').'.xlsx'
        );
    }

    private function resolveRequestedPeriodId(Request $request): ?int
    {
        $requestedPeriodId = $request->integer('periode_id');

        if ($requestedPeriodId > 0) {
            return $requestedPeriodId;
        }

        return Periode::getActivePeriod()?->id
            ?? Periode::query()->orderByDesc('start_date')->orderByDesc('id')->value('id');
    }
}
