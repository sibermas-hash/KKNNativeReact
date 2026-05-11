<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Imports\MetodologiPkmImport;
use App\Imports\WorkshopAttendanceImport;
use App\Imports\WorkshopPesertaImport;
use App\Models\KKN\Workshop;
use App\Services\WorkshopService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class WorkshopController extends Controller
{
    use ApiResponse;

    public function __construct(private WorkshopService $workshopService) {}

    public function index(Request $request): JsonResponse
    {
        $workshops = $this->workshopService->getUpcomingWorkshops(
            userId: null,
            includeParticipants: true,
            includeAllStatuses: true,
            periodId: $request->input('periode_id') ? (int) $request->input('periode_id') : null
        );

        return $this->success($workshops);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'periode_id' => 'required|exists:periode,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'workshop_date' => 'required|date',
            'methodology' => 'nullable|string',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
            'location' => 'nullable|string',
            'max_participants' => 'nullable|integer|min:1',
        ]);

        $workshop = $this->workshopService->createWorkshop($validated);

        return $this->success($workshop, 'Workshop berhasil dibuat.', 201);
    }

    public function update(Request $request, Workshop $workshop): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'workshop_date' => 'required|date',
            'methodology' => 'nullable|string',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
            'location' => 'nullable|string',
            'max_participants' => 'nullable|integer|min:1',
        ]);

        try {
            $this->workshopService->updateWorkshop($workshop, $validated);
        } catch (\InvalidArgumentException $e) {
            return $this->error('VALIDATION_ERROR', $e->getMessage(), 422);
        }

        return $this->success($workshop->refresh(), 'Workshop berhasil diperbarui.');
    }

    public function cancel(Workshop $workshop): JsonResponse
    {
        try {
            $this->workshopService->cancelWorkshop($workshop);
        } catch (\InvalidArgumentException $e) {
            return $this->error('VALIDATION_ERROR', $e->getMessage(), 422);
        }

        return $this->noContent('Workshop dibatalkan.');
    }

    public function markAttendance(Request $request, int $workshopId): JsonResponse
    {
        $validated = $request->validate([
            'user_ids' => 'nullable|array',
            'user_ids.*' => 'integer',
        ]);

        $this->workshopService->bulkMarkAttendance(
            $workshopId,
            collect($validated['user_ids'] ?? [])->map(fn ($id) => (int) $id)->all()
        );

        return $this->noContent('Presensi berhasil diperbarui.');
    }

    public function importAttendance(Request $request, int $workshopId): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:10240'],
            'type' => 'nullable|in:mahasiswa,dosen',
        ]);

        $type = $validated['type'] ?? 'dosen';

        $import = new WorkshopAttendanceImport($workshopId, $type);
        Excel::import($import, $request->file('file'));

        return $this->success([
            'processed' => $import->processedCount,
        ], "Import {$import->processedCount} peserta kehadiran berhasil.");
    }

    public function exportParticipants(Workshop $workshop)
    {
        $participants = $workshop->peserta()
            ->with('user:id,name,email')
            ->get()
            ->map(fn ($p) => [
                'nama' => $p->user?->name,
                'email' => $p->user?->email,
                'attended' => $p->attended ? 'Hadir' : 'Tidak Hadir',
                'is_passed' => $p->is_passed ? 'Lulus' : 'Belum',
                'certificate_generated' => $p->certificate_generated ? 'Ya' : 'Tidak',
            ]);

        return $this->success($participants, 'Data peserta workshop.');
    }

    /**
     * Download template sertifikat workshop.
     */
    public function downloadCertificateTemplate(Workshop $workshop)
    {
        $templatePath = storage_path('app/templates/certificate_template.docx');

        if (! file_exists($templatePath)) {
            abort(404, 'Template sertifikat tidak ditemukan.');
        }

        return response()->download(
            $templatePath,
            "Template_Sertifikat_{$workshop->title}.docx",
            ['Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        );
    }

    /**
     * POST /admin/workshops/{workshopId}/import-peserta
     * Import peserta workshop dari file Excel (format: NIP | Nama).
     */
    public function importPeserta(Request $request, int $workshopId): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:10240'],
        ]);

        $workshop = Workshop::findOrFail($workshopId);

        $import = new WorkshopPesertaImport($workshop->id);
        Excel::import($import, $request->file('file'));

        $response = [
            'success' => $import->successCount,
            'skipped' => $import->skippedCount,
            'not_found' => $import->notFoundCount,
        ];

        if ($import->notFoundCount > 0) {
            $response['not_found_details'] = $import->notFoundDetails;
        }

        $message = "Import selesai: {$import->successCount} peserta berhasil ditambahkan.";
        if ($import->notFoundCount > 0) {
            $message .= " {$import->notFoundCount} NIP tidak ditemukan di master dosen.";
        }
        if ($import->skippedCount > 0) {
            $message .= " {$import->skippedCount} dilewati (sudah terdaftar/kosong).";
        }

        return $this->success($response, $message);
    }

    /**
     * GET /admin/workshops/template-peserta
     * Download template Excel untuk import peserta workshop.
     */
    public function downloadPesertaTemplate(): BinaryFileResponse
    {
        $templatePath = storage_path('app/templates/template_peserta_workshop.xlsx');

        // Generate template on-the-fly if not exists
        if (! file_exists($templatePath)) {
            $dir = dirname($templatePath);
            if (! is_dir($dir)) {
                mkdir($dir, 0755, true);
            }

            $spreadsheet = new Spreadsheet;
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Peserta Workshop');

            // Header
            $sheet->setCellValue('A1', 'nip');
            $sheet->setCellValue('B1', 'nama');

            // Styling header
            $sheet->getStyle('A1:B1')->getFont()->setBold(true);
            $sheet->getColumnDimension('A')->setWidth(25);
            $sheet->getColumnDimension('B')->setWidth(40);

            // Contoh data
            $sheet->setCellValue('A2', '198501012010011001');
            $sheet->setCellValue('B2', 'Dr. Ahmad Fauzi, M.Pd. (contoh)');
            $sheet->setCellValue('A3', '199003152015012002');
            $sheet->setCellValue('B3', 'Siti Nurhaliza, M.Si. (contoh)');

            // Petunjuk di sheet 2
            $instructions = $spreadsheet->createSheet();
            $instructions->setTitle('Petunjuk');
            $instructions->setCellValue('A1', 'PETUNJUK IMPORT PESERTA WORKSHOP');
            $instructions->setCellValue('A3', '1. Isi kolom "nip" dengan NIP dosen (wajib)');
            $instructions->setCellValue('A4', '2. Kolom "nama" bersifat opsional (untuk verifikasi visual saja)');
            $instructions->setCellValue('A5', '3. Sistem akan mencocokkan NIP dengan database dosen');
            $instructions->setCellValue('A6', '4. Dosen yang cocok akan otomatis ditandai sebagai peserta yang sudah hadir');
            $instructions->setCellValue('A7', '5. Dosen yang sudah terdaftar di workshop ini akan dilewati');
            $instructions->setCellValue('A8', '6. Hapus baris contoh sebelum import');
            $instructions->getStyle('A1')->getFont()->setBold(true)->setSize(14);
            $instructions->getColumnDimension('A')->setWidth(70);

            $spreadsheet->setActiveSheetIndex(0);

            $writer = new Xlsx($spreadsheet);
            $writer->save($templatePath);
        }

        return response()->download($templatePath, 'Template_Import_Peserta_Workshop.xlsx');
    }

    public function importMetodologiPkm(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:10240'],
        ]);

        $import = new MetodologiPkmImport;
        Excel::import($import, $request->file('file'));

        $response = [
            'matched' => $import->matchedCount,
            'unmatched' => $import->unmatchedCount,
            'workshop_created' => $import->createdWorkshopCount,
            'skipped' => $import->skippedCount,
        ];

        if ($import->unmatchedCount > 0) {
            $response['unmatched_details'] = $import->unmatchedDetails;
        }

        if (count($import->errors) > 0) {
            $response['errors'] = $import->errors;
        }

        $message = "Import selesai: {$import->matchedCount} peserta berhasil diimport.";
        if ($import->unmatchedCount > 0) {
            $message .= " {$import->unmatchedCount} peserta tidak ditemukan di master dosen.";
        }

        return $this->success($response, $message);
    }
}
