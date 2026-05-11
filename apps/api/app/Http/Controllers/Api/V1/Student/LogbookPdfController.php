<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Models\KKN\Periode;
use App\Services\LogbookPdfService;
use App\Services\PeriodContextService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Student endpoint: download own logbook PDF (all approved activities for active periode).
 *
 * GET /api/v1/student/logbook/pdf?periode={id}&include_draft=0
 */
class LogbookPdfController extends Controller
{
    public function __construct(
        private readonly LogbookPdfService $service,
        private readonly PeriodContextService $periodContext,
    ) {}

    public function download(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user && $user->mahasiswa, 403, 'Akun ini bukan mahasiswa.');

        $mahasiswa = $user->mahasiswa;

        // Ambil periode — default ke active period (session or default)
        $periodeId = $request->integer('periode');
        if ($periodeId > 0) {
            $periode = Periode::findOrFail($periodeId);
        } else {
            $activePeriode = $this->periodContext->getActivePeriod();
            abort_unless($activePeriode, 404, 'Tidak ada periode aktif.');
            $periode = $activePeriode;
        }

        $includeDraft = $request->boolean('include_draft');

        $pdf = $this->service->generate($mahasiswa, $periode, approvedOnly: ! $includeDraft);

        $filename = sprintf(
            'logbook-kkn-%s-%s.pdf',
            $mahasiswa->nim ?? 'mhs',
            now()->format('Ymd')
        );

        return $pdf->download($filename);
    }
}
