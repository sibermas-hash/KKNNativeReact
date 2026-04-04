<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Repositories\KknScoreRepository;
use App\Services\GradingService;
use App\Services\CertificateService;
use App\Exports\RekapNilaiExport;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\LaporanAkhir;
use App\Models\KKN\Periode;
use App\Models\KKN\Fakultas;
use Illuminate\Support\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

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
            'period_id' => $periodeId,
            'faculty_id' => $facultyScopeId,
            'kelompok_id' => $request->integer('kelompok_id'),
            'huruf' => $request->string('huruf')->toString() ?: null,
        ];

        if (!$periodeId) {
            return Inertia::render('Admin/RekapNilai/Index', [
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

        return Inertia::render('Admin/RekapNilai/Index', [
            'scores' => $this->transformRows($rows),
            'stats' => [
                'total' => $rows->count(),
                'finalized' => $rows->where('is_finalized', true)->count(),
                'pending' => $rows->where('is_finalized', false)->count(),
                'avg_score' => round($rows->avg('nilai_akhir') ?? 0, 2),
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

        $periodeId = $request->integer('period_id');
        $rows = $this->repo->getRekapNilai($periodeId, $request->only(['faculty_id', 'kelompok_id']));
        $periode = Periode::findOrFail($periodeId);

        return Excel::download(
            new RekapNilaiExport($rows, $periode),
            "Rekap_Nilai_KKN_{$periode->name}_" . now()->format('Ymd') . ".xlsx"
        );
    }

    public function finalizeMass(Request $request)
    {
        $this->authorize('bulkFinalize', NilaiKkn::class);

        $validated = $request->validate([
            'period_id' => 'required|exists:periode,id',
        ]);

        $this->grading->dispatchMassFinalization($validated['period_id']);

        return back()->with('info', "Proses finalisasi massal telah dimulai di latar belakang.");
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

        if (!$score->mahasiswa) {
            return back()->with('error', 'Data mahasiswa untuk nilai ini tidak ditemukan.');
        }

        $reportApproved = LaporanAkhir::where('mahasiswa_id', $score->mahasiswa->id)
            ->where('kelompok_id', $score->kelompok_id)
            ->where('status', 'approved')
            ->exists();

        if (!$reportApproved) {
            return back()->with('error', 'Laporan akhir mahasiswa belum disetujui, sehingga nilai belum dapat difinalisasi.');
        }

        $score->update(['is_finalized' => true]);

        if ($score->mahasiswa?->user) {
            $score->mahasiswa->user->notify(new \App\Notifications\KknActivityNotification([
                'type' => 'success',
                'title' => 'Nilai KKN Difinalisasi',
                'message' => 'Nilai KKN Anda telah difinalisasi oleh Admin LPPM. Silakan unduh sertifikat.',
                'icon' => 'academic-cap',
                'url' => route('student.dashboard'),
            ]));
        }

        return back()->with('success', 'Nilai mahasiswa berhasil difinalisasi.');
    }

    public function getFinalizeProgress(Request $request)
    {
        $this->authorize('bulkFinalize', NilaiKkn::class);
        $periodId = $request->integer('period_id');
        
        $progress = \Illuminate\Support\Facades\Cache::get("finalize_progress_{$periodId}");
        
        return response()->json($progress);
    }

    public function downloadCertificate(NilaiKkn $score)
    {
        $this->authorize('view', $score);

        if (!$score->is_finalized) {
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
        $rows = $this->repo->getRekapNilai($periodeId, $request->only(['faculty_id', 'kelompok_id']));
        $finalized = $rows->where('is_finalized', true);

        if ($finalized->isEmpty()) {
            return back()->with('error', 'Tidak ada nilai yang sudah difinalisasi untuk periode ini.');
        }

        $zip = new \ZipArchive();
        $zipName = "Sertifikat_Massal_KKN_Periode_{$periodeId}.zip";
        // VULN-014 Fix: Store ZIP in non-public directory to prevent unauthorized access
        $zipPath = storage_path("app/tmp/{$zipName}");
        
        // Ensure tmp directory exists
        if (!is_dir(dirname($zipPath))) {
            mkdir(dirname($zipPath), 0755, true);
        }

        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === TRUE) {
            // Eager load all required relationships to avoid N+1 queries in the loop
            $studentIds = $finalized->pluck('user_id');
            $groupCodes = $finalized->pluck('kode_kelompok')->unique();

            $scores = NilaiKkn::with([
                'mahasiswa.user',
                'kelompok.periode',
                'kelompok.lokasi',
                'kelompok.dosen.user',
            ])
            ->whereIn('user_id', $studentIds)
            ->whereHas('kelompok', fn($q) => $q->whereIn('code', $groupCodes))
            ->get()
            ->groupBy(fn($s) => $s->user_id . '|' . $s->kelompok->code);

            foreach ($finalized as $row) {
                $lookupKey = $row->user_id . '|' . $row->kode_kelompok;
                $score = $scores->get($lookupKey)?->first();
                
                if ($score && $score->mahasiswa) {
                    $pdf = $this->certificate->generateForStudent($score);
                    $nim = $score->mahasiswa->nim ?? '';
                    $pdfName = "Sertifikat_{$score->mahasiswa->nama}_{$nim}.pdf";
                    $zip->addFromString($pdfName, $pdf->output());
                }
            }
            $zip->close();
        }

        return response()->download($zipPath)->deleteFileAfterSend(true);
    }
    private const ALLOWED_SCORE_COMPONENTS = [
        'final_report_score',
        'execution_score',
        'article_score',
        'discipline_score',
        'attitude_score',
        'workshop_score',
        'administration_score',
        'dpl_score_1',
    ];

    public function saveInline(Request $request)
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer'],
            'kelompok_id' => ['required', 'integer'],
            'component' => ['required', 'string', 'in:' . implode(',', self::ALLOWED_SCORE_COMPONENTS)],
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
                'id' => $row->score_id ? (int) $row->score_id : ((int) $row->mahasiswa_id . '-' . (int) $row->kelompok_id),
                'score_id' => $row->score_id ? (int) $row->score_id : null,
                'student_id' => (int) $row->mahasiswa_id,
                'kelompok_id' => (int) $row->kelompok_id,
                'nim' => $row->nim,
                'nama' => $row->nama,
                'prodi' => $row->prodi,
                'fakultas' => $row->fakultas,
                'n_dpl' => $row->n_dpl,
                'n_mitra' => $row->n_mitra,
                'n_admin' => $row->n_admin,
                'total' => $row->nilai_akhir,
                'grade' => $row->huruf,
                'is_finalized' => (bool) $row->is_finalized,
                'evidence_file' => $row->evidence_file,
                'status_submit' => [
                    'dpl' => !is_null($row->dpl_submitted_at),
                    'mitra' => !is_null($row->mitra_submitted_at),
                    'admin' => !is_null($row->admin_submitted_at),
                ],
            ];
        })->values()->all();
    }

    private function lockedFacultyPayload($user): ?array
    {
        if (!$user->hasRole('faculty_admin') || !$user->fakultas) {
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
            'period_id' => 'required|exists:periode,id',
            'faculty_id' => 'nullable|exists:fakultas,id',
        ]);

        $rows = $this->repo->getRekapNilai($validated['period_id'], [
            'faculty_id' => $validated['faculty_id'] ?? null,
        ]);

        $periode = Periode::find($validated['period_id']);
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
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
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'color' => ['rgb' => '1E40AF']],
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
            $gradeColor = match($r->huruf) {
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

        $facultyName = $validated['faculty_id'] ? Fakultas::find($validated['faculty_id'])?->nama : 'Semua';
        $filename = "Ledger_Nilai_KKN_{$periode->name}_{$facultyName}_" . date('Y-m-d_His') . '.xlsx';
        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'kkn_ledger_');
        $writer->save($tempFile . '.xlsx');
        $finalFile = $tempFile . '.xlsx';

        return response()->download($finalFile, $filename)->deleteFileAfterSend(true);
    }
}
