<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

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
        $periodeId = $request->integer('period_id', $activePeriod?->id ?? $periods->first()?->id);

        $facultyScopeId = $user->hasRole('faculty_admin')
            ? ($user->faculty_id ?: -1)
            : $request->integer('faculty_id');

        $filters = [
            'search' => $request->string('search')->toString() ?: null,
            'period_id' => $periodeId,
            'faculty_id' => $facultyScopeId,
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
            'faculty_id' => $request->input('faculty_id'),
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
            'period_id' => 'required|exists:periode,id',
        ]);

        $this->grading->dispatchMassFinalization($validated['period_id']);

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
        $periodId = $request->integer('period_id');

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

    public function bulkCertificates(Request $request)
    {
        $this->authorize('export', NilaiKkn::class);

        $periodeId = $request->integer('period_id');
        $filters = $request->only(['faculty_id', 'kelompok_id']);

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
        $periodId = $request->integer('period_id');
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
            'period_id' => 'required|exists:periode,id',
            'faculty_id' => 'nullable|exists:fakultas,id',
        ]);

        $query = NilaiKkn::whereHas('kelompok', function ($q) use ($validated) {
            $q->where('period_id', $validated['period_id']);
        })->whereNull('admin_locked_at');

        if ($validated['faculty_id']) {
            $query->whereHas('mahasiswa', function ($q) use ($validated) {
                $q->where('faculty_id', $validated['faculty_id']);
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
            'period_id' => 'required|exists:periode,id',
            'faculty_id' => 'nullable|exists:fakultas,id',
        ]);

        $query = NilaiKkn::whereHas('kelompok', function ($q) use ($validated) {
            $q->where('period_id', $validated['period_id']);
        })->whereNotNull('admin_locked_at');

        if ($validated['faculty_id']) {
            $query->whereHas('mahasiswa', function ($q) use ($validated) {
                $q->where('faculty_id', $validated['faculty_id']);
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

        $validated = $request->validate([
            'faculty_id' => 'nullable|exists:fakultas,id',
        ]);

        $periodeId = $this->resolveRequestedPeriodId($request);

        if (! $periodeId) {
            return back()->with('error', 'Pilih periode terlebih dahulu sebelum mengekspor ledger nilai.');
        }

        $rows = $this->repo->getRekapNilai($periodeId, [
            'faculty_id' => $validated['faculty_id'] ?? null,
            'search' => $request->input('search'),
            'huruf' => $request->input('huruf'),
        ]);

        $periode = Periode::find($periodeId);

        if (! $periode) {
            return back()->with('error', 'Periode rekap nilai tidak ditemukan.');
        }
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();

        // Headers
        $headers = ['No', 'NIM', 'Nama', 'Prodi', 'Fakultas', 'Kelompok', 'Nilai DPL', 'Nilai Mitra', 'Nilai Admin', 'Nilai Akhir', 'Grade', 'Status'];
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue("{$col}1", $header);
            $col++;
        }

        // Styling header
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => '1E40AF']],
        ];
        $sheet->getStyle('A1:L1')->applyFromArray($headerStyle);

        // Data
        $row = 2;
        foreach ($rows as $index => $r) {
            $sheet->setCellValue("A{$row}", $index + 1);
            $sheet->setCellValue("B{$row}", $r->nim ?? '-');
            $sheet->setCellValue("C{$row}", $r->nama ?? '-');
            $sheet->setCellValue("D{$row}", $r->prodi ?? '-');
            $sheet->setCellValue("E{$row}", $r->fakultas ?? '-');
            $sheet->setCellValue("F{$row}", $r->group_name ?? '-');
            $sheet->setCellValue("G{$row}", $r->n_dpl ?? '-');
            $sheet->setCellValue("H{$row}", $r->n_mitra ?? '-');
            $sheet->setCellValue("I{$row}", $r->n_admin ?? '-');
            $sheet->setCellValue("J{$row}", $r->nilai_akhir ?? '-');
            $sheet->setCellValue("K{$row}", $r->huruf ?? '-');
            $sheet->setCellValue("L{$row}", $r->is_finalized ? 'Final' : 'Draft');

            // Color code grade
            $gradeColor = match ($r->huruf) {
                'A' => '22C55E',
                'A-' => '4ADE80',
                'B+' => '60A5FA',
                'B' => '3B82F6',
                'B-' => '93C5FD',
                'C+' => 'FBBF24',
                'C' => 'F59E0B',
                'D' => 'F97316',
                'E' => 'EF4444',
                default => '9CA3AF',
            };
            $sheet->getStyle("K{$row}")->getFont()->getColor()->setRGB($gradeColor);

            $row++;
        }

        // Auto-size columns
        foreach (range('A', 'L') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $facultyId = $validated['faculty_id'] ?? null;
        $facultyName = $facultyId ? Fakultas::find($facultyId)?->nama : 'Semua';
        $filename = "Ledger_Nilai_KKN_{$periode->name}_{$facultyName}_".date('Y-m-d_His').'.xlsx';
        $writer = new Xlsx($spreadsheet);

        // SECURITY: Use Laravel's storage path instead of system temp directory
        $exportDir = storage_path('framework/cache/exports');
        if (! is_dir($exportDir)) {
            mkdir($exportDir, 0750, true);
        }

        $tempFile = $exportDir.'/'.Str::uuid().'.xlsx';
        try {
            $writer->save($tempFile);

            return response()->download($tempFile, $filename)->deleteFileAfterSend(true);
        } catch (\Throwable $e) {
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }
            Log::error('Ledger export failed', ['exception' => $e]);
            abort(500, 'Gagal mengekspor ledger nilai.');
        }
    }

    private function resolveRequestedPeriodId(Request $request): ?int
    {
        $requestedPeriodId = $request->integer('period_id');

        if ($requestedPeriodId > 0) {
            return $requestedPeriodId;
        }

        return Periode::getActivePeriod()?->id
            ?? Periode::query()->orderByDesc('start_date')->orderByDesc('id')->value('id');
    }
}
