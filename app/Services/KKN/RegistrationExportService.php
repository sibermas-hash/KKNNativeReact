<?php

declare(strict_types=1);

namespace App\Services\KKN;

use App\Exports\BpjsParticipantExport;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Service for handling registration data exports.
 * Extracted from PesertaKknController to reduce controller bloat.
 */
class RegistrationExportService
{
    /**
     * Export registrations to Excel.
     */
    public function exportToExcel(Collection $registrations): BinaryFileResponse
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();

        // Headers
        $headers = ['No', 'NIM', 'Nama', 'Fakultas', 'Program Studi', 'Periode', 'Kelompok', 'Status', 'Tanggal Daftar'];
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue("{$col}1", $header);
            $col++;
        }

        // Style headers
        $this->styleHeaderRow($sheet, count($headers));

        // Data rows
        $row = 2;
        foreach ($registrations as $index => $reg) {
            $this->fillDataRow($sheet, $row, $index, $reg);
            $row++;
        }

        // Auto-size columns
        foreach (range('A', 'I') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        return $this->saveAndDownload($spreadsheet, 'data-pendaftaran-kkn-'.date('Y-m-d-His').'.xlsx');
    }

    /**
     * Export BPJS participant data to Excel.
     */
    public function exportBpjs(Collection $registrations): BinaryFileResponse
    {
        return Excel::download(
            new BpjsParticipantExport($registrations),
            'peserta-bpjs-kkn.xlsx'
        );
    }

    /**
     * Style the header row.
     */
    private function styleHeaderRow(Spreadsheet $sheet, int $columnCount): void
    {
        $lastColumn = range('A', 'Z')[$columnCount - 1];
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => '2563EB']],
        ];
        $sheet->getStyle("A1:{$lastColumn}1")->applyFromArray($headerStyle);
    }

    /**
     * Fill a single data row.
     */
    private function fillDataRow(Spreadsheet $sheet, int $row, int $index, object $reg): void
    {
        $sheet->setCellValue("A{$row}", $index + 1);
        $sheet->setCellValue("B{$row}", $reg->mahasiswa?->nim ?? '-');
        $sheet->setCellValue("C{$row}", $reg->mahasiswa?->nama ?? '-');
        $sheet->setCellValue("D{$row}", $reg->mahasiswa?->fakultas?->nama ?? '-');
        $sheet->setCellValue("E{$row}", $reg->mahasiswa?->prodi?->nama ?? '-');
        $sheet->setCellValue("F{$row}", $reg->periode?->name ?? '-');
        $sheet->setCellValue("G{$row}", $reg->kelompok?->nama_kelompok ?? 'Belum ada');
        $sheet->setCellValue("H{$row}", ucfirst($reg->status));
        $sheet->setCellValue("I{$row}", $reg->created_at->format('d M Y H:i'));

        // Color code status
        $statusColor = [
            'pending' => 'FFA500',
            'approved' => '22C55E',
            'rejected' => 'EF4444',
        ][$reg->status] ?? '000000';

        $sheet->getStyle("H{$row}")->getFont()->getColor()->setRGB($statusColor);
    }

    /**
     * Save spreadsheet to temp file and return download response.
     */
    private function saveAndDownload(Spreadsheet $spreadsheet, string $filename): BinaryFileResponse
    {
        $exportDir = storage_path('framework/cache/exports');
        if (! is_dir($exportDir)) {
            mkdir($exportDir, 0750, true);
        }

        $tempFile = $exportDir.'/'.Str::uuid().'.xlsx';
        $writer = new Xlsx($spreadsheet);

        try {
            $writer->save($tempFile);

            return response()->download($tempFile, $filename)->deleteFileAfterSend(true);
        } catch (\Throwable $e) {
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }
            DB::connection()->getPdo(); // Test DB connection exists for logging
            \Illuminate\Support\Facades\Log::error('Export failed', ['exception' => $e]);
            abort(500, 'Gagal mengekspor data.');
        }
    }
}
