<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Services\ComprehensiveReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Comprehensive report — executive summary PDF for LP2M.
 *
 * Endpoint:
 *   GET /admin/report/comprehensive/{periode} — download PDF
 *
 * Semua periode bisa di-export oleh admin/superadmin/faculty_admin.
 */
class ComprehensiveReportController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly ComprehensiveReportService $service
    ) {}

    public function download(int $periode): Response|JsonResponse
    {
        // R13-API-009: wrap PDF generation so DomPDF crashes or missing-data
        // exceptions return a proper JSON envelope rather than an HTML error
        // page that the client will try to save as `.pdf`.
        try {
            $pdf = $this->service->generateForPeriode($periode);
            $filename = 'laporan-komprehensif-kkn-periode-'.$periode.'-'.now()->format('Ymd').'.pdf';

            return $pdf->download($filename);
        } catch (\Throwable $e) {
            Log::error('ComprehensiveReportController::download failed', [
                'periode_id' => $periode,
                'error' => $e->getMessage(),
            ]);

            return $this->error(
                'REPORT_GENERATION_FAILED',
                'Gagal menghasilkan laporan komprehensif. Silakan hubungi administrator.',
                500,
            );
        }
    }
}
