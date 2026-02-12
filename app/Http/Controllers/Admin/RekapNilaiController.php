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
        $filters = $request->only(['faculty_id', 'group_id', 'huruf']);

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
        $rows = $this->repo->getRekapNilai($periodeId, $request->only(['faculty_id', 'group_id']));
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

        return back()->with('success', "Proses finalisasi massal telah dimulai di latar belakang.");
    }

    public function downloadCertificate(NilaiKkn $score)
    {
        $this->authorize('view', $score);

        if (!$score->is_finalized) {
            return back()->with('error', 'Sertifikat hanya tersedia untuk nilai yang sudah difinalisasi.');
        }

        $pdf = $this->certificate->generateForStudent($score);
        $nim = $score->mahasiswa->student->nim ?? '';
        $filename = "Sertifikat_KKN_{$score->mahasiswa->name}_{$nim}.pdf";
        
        return $pdf->download($filename);
    }

    public function bulkCertificates(Request $request)
    {
        $this->authorize('export', NilaiKkn::class);

        $periodeId = $request->integer('period_id');
        $rows = $this->repo->getRekapNilai($periodeId, $request->only(['faculty_id', 'group_id']));
        $finalized = $rows->where('is_finalized', true);

        if ($finalized->isEmpty()) {
            return back()->with('error', 'Tidak ada nilai yang sudah difinalisasi untuk periode ini.');
        }

        $zip = new \ZipArchive();
        $zipName = "Sertifikat_Massal_KKN_Periode_{$periodeId}.zip";
        $zipPath = storage_path("app/public/{$zipName}");

        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === TRUE) {
            foreach ($finalized as $row) {
                $score = NilaiKkn::where('mahasiswa_id', $row->user_id)
                    ->whereHas('kelompok', fn($q) => $q->where('code', $row->kode_kelompok))
                    ->first();
                
                if ($score) {
                    $pdf = $this->certificate->generateForStudent($score);
                    $nim = $score->mahasiswa->student->nim ?? '';
                    $pdfName = "Sertifikat_{$score->mahasiswa->name}_{$nim}.pdf";
                    $zip->addFromString($pdfName, $pdf->output());
                }
            }
            $zip->close();
        }

        return response()->download($zipPath)->deleteFileAfterSend(true);
    }
}
