<?php

namespace App\Http\Controllers;

use App\Models\KknScore;
use App\Services\CertificateService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use ZipArchive;
use Illuminate\Support\Facades\Storage;

class CertificateController extends Controller
{
    public function __construct(
        private CertificateService $service
    ) {}

    /**
     * Download individual certificate
     */
    public function download(KknScore $score)
    {
        $this->authorize('view', $score);

        if (!$score->is_finalized) {
            return back()->with('error', 'Nilai belum difinalisasi oleh Admin.');
        }

        return $this->service->generateForStudent($score)->download("Sertifikat_KKN_{$score->student_id}.pdf");
    }

    /**
     * Mass download certificates for a period as ZIP
     */
    public function downloadMass(Request $request)
    {
        $this->authorize('bulkFinalize', KknScore::class);

        $periodId = $request->integer('period_id');
        $scores = KknScore::whereHas('group', fn($q) => $q->where('period_id', $periodId))
            ->where('is_finalized', true)
            ->where('total_score', '>=', 70)
            ->with('student')
            ->get();

        if ($scores->isEmpty()) {
            return back()->with('error', 'Tidak ada sertifikat yang siap diunduh untuk periode ini.');
        }

        $zip = new ZipArchive;
        $fileName = "Mass_Certificates_Period_{$periodId}.zip";
        $tempDir = storage_path('app/temp');
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }
        $tempPath = $tempDir . "/{$fileName}";

        if ($zip->open($tempPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
            foreach ($scores as $score) {
                $pdf = $this->service->generateForStudent($score)->output();
                $pdfFileName = "Sertifikat_" . str_replace(' ', '_', $score->student->name) . "_" . $score->student_id . ".pdf";
                $zip->addFromString($pdfFileName, $pdf);
            }
            $zip->close();
        }

        return response()->download($tempPath)->deleteFileAfterSend(true);
    }
}
