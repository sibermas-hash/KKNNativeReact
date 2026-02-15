<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Repositories\KknScoreRepository;
use App\Services\GradingService;
use App\Services\CertificateService;
use App\Exports\RekapNilaiExport;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\Fakultas;
use App\Models\KKN\KelompokKkn;
use Illuminate\Http\Request;
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
        $this->authorize('viewAny', NilaiKkn::class);

        $activePeriod = Periode::getActivePeriod();
        $periodeId = $request->integer('period_id', $activePeriod?->id);
        $filters = $request->only(['faculty_id', 'kelompok_id', 'huruf']);

        if (!$periodeId) {
            return Inertia::render('Admin/RekapNilai/Index', [
                'rows' => Inertia::defer(fn () => []),
                'stats' => Inertia::defer(fn () => null),
                'filters' => $filters,
                'periodeId' => null,
                'periods' => Periode::all(),
                'faculties' => [],
                'groups' => [],
            ]);
        }

        return Inertia::render('Admin/RekapNilai/Index', [
            'rows' => Inertia::defer(fn () => $this->repo->getRekapNilai($periodeId, $filters)),
            'stats' => Inertia::defer(function () use ($periodeId, $filters) {
                $rows = $this->repo->getRekapNilai($periodeId, $filters);
                return [
                    'total' => $rows->count(),
                    'finalized' => $rows->where('is_finalized', true)->count(),
                    'missing_dpl' => $rows->whereNull('dpl_submitted_at')->count(),
                    'missing_mitra' => $rows->whereNull('mitra_submitted_at')->count(),
                    'distribusi' => $rows->groupBy('huruf')->map->count()->sortKeys(),
                    'rata_rata' => round($rows->avg('nilai_akhir') ?? 0, 2),
                ];
            }),
            'filters' => $filters,
            'periodeId' => $periodeId,
            'periods' => Periode::all(),
            'faculties' => Fakultas::select('id', 'nama as name')->get(),
            'groups' => Inertia::defer(fn () => KelompokKkn::where('period_id', $periodeId)
                ->select('id', 'code as kode_kelompok')->orderBy('code')->get()),
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

        $this->grading->dispatchMassFinalization($request->integer('period_id'));

        return back()->with('info', "Proses finalisasi massal telah dimulai di latar belakang.");
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
        $zipPath = storage_path("app/public/{$zipName}");

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
            ->whereIn('mahasiswa_id', $studentIds)
            ->whereHas('kelompok', fn($q) => $q->whereIn('code', $groupCodes))
            ->get()
            ->groupBy(fn($s) => $s->mahasiswa_id . '|' . $s->kelompok->code);

            foreach ($finalized as $row) {
                $lookupKey = $row->user_id . '|' . $row->kode_kelompok;
                $score = $scores->get($lookupKey)?->first();
                
                if ($score) {
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
    public function saveInline(Request $request)
    {
        $this->authorize('update', NilaiKkn::class);

        $validated = $request->validate([
            'user_id' => ['required', 'integer'],
            'kelompok_id' => ['required', 'integer'],
            'component' => ['required', 'string'],
            'value' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

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
}