<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Periode;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class GradeExportService
{
    /**
     * Generate Excel for a single group or all groups in a period.
     */
    public function exportExcel($kelompokKkn, array $students, ?int $periodId = null): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();

        if ($kelompokKkn === 'all') {
            $sheet->setTitle('Database Nilai KKN');
            $this->populateSheetBulk($sheet, $students, $periodId);
            $filename = "Database_Nilai_KKN_Angkatan_{$periodId}.xlsx";
        } else {
            $this->populateSheet($sheet, $kelompokKkn, $students);
            $filename = "Blanko_Penilaian_Kelompok_{$kelompokKkn->code}.xlsx";
        }

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /**
     * Generate PDF for a group or bulk period.
     */
    public function exportPdf($kelompokKkn, array $students, ?int $periodId = null): \Illuminate\Http\Response
    {
        if ($kelompokKkn === 'all') {
            $period = Periode::with('tahunAkademik')->findOrFail($periodId);
            $pdf = Pdf::loadView('admin.exports.blanko_nilai_bulk_list', [
                'students' => $students,
                'period_id' => $periodId,
                'periode' => $period->name,
                'tahun' => $period->tahunAkademik?->year ?? date('Y'),
            ]);

            return $pdf->download("Database_Nilai_KKN_Periode_{$periodId}.pdf");
        } else {
            $pdf = Pdf::loadView('admin.exports.blanko_nilai', [
                'group' => $kelompokKkn,
                'students' => $students,
                'periode' => $kelompokKkn->periode?->name ?? '57',
                'tahun' => $kelompokKkn->periode?->tahunAkademik?->year ?? date('Y'),
            ]);

            return $pdf->download("Blanko_Penilaian_Kelompok_{$kelompokKkn->code}.pdf");
        }
    }

    public function populateSheet($sheet, KelompokKkn $kelompokKkn, array $students)
    {
        // === HEADER ===
        $sheet->mergeCells('A1:F1');
        $sheet->setCellValue('A1', 'Blanko Penilaian Peserta KKN');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells('A2:F2');
        $sheet->setCellValue('A2', 'Angkatan '.($kelompokKkn->periode?->name ?? '57').' Tahun '.($kelompokKkn->periode?->tahunAkademik?->year ?? date('Y')));
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(12);
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $mainDpl = $kelompokKkn->dosen->where('pivot.role', 'Ketua')->first();

        // === META DATA ===
        $meta = [
            'KELOMPOK' => preg_replace('/[^0-9]/', '', $kelompokKkn->code),
            'DESA' => $kelompokKkn->lokasi?->village_name ?? '-',
            'KECAMATAN' => $kelompokKkn->lokasi?->district_name ?? '-',
            'KABUPATEN' => $kelompokKkn->lokasi?->regency_name ?? '-',
            'DPL' => $mainDpl?->user?->name ?? '-',
        ];

        $row = 4;
        foreach ($meta as $label => $value) {
            $sheet->mergeCells("A{$row}:B{$row}");
            $sheet->setCellValue("A{$row}", $label);
            $sheet->setCellValue("C{$row}", ': '.$value);
            $row++;
        }

        // === TABLE HEADER ===
        $headerRow = 10;
        $headers = ['NO', 'NAMA MAHASISWA', 'NIM', 'DISIPLIN', 'SIKAP', 'TOTAL NILAI'];
        $cols = ['A', 'B', 'C', 'D', 'E', 'F'];

        foreach ($headers as $i => $h) {
            $col = $cols[$i];
            $sheet->setCellValue("{$col}{$headerRow}", $h);
            $sheet->getStyle("{$col}{$headerRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("{$col}{$headerRow}")->getFont()->setBold(true);
            $sheet->getStyle("{$col}{$headerRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        }

        $currentRow = 11;
        foreach ($students as $idx => $student) {
            $sheet->setCellValue("A{$currentRow}", $idx + 1);
            $sheet->setCellValue("B{$currentRow}", $student['name']);
            $sheet->setCellValueExplicit("C{$currentRow}", $student['nim'], DataType::TYPE_STRING);

            if ($student['discipline'] !== null) {
                $sheet->setCellValue("D{$currentRow}", $student['discipline']);
            }
            if ($student['attitude'] !== null) {
                $sheet->setCellValue("E{$currentRow}", $student['attitude']);
            }

            if ($student['discipline'] !== null && $student['attitude'] !== null) {
                $total = round(($student['discipline'] + $student['attitude']) / 2);
                $sheet->setCellValue("F{$currentRow}", $total);
            }
            $sheet->getStyle("A{$currentRow}:F{$currentRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
            $currentRow++;
        }

        // === FOOTER ===
        $footerStartRow = $currentRow + 1;
        $sigCol = 'D';
        $sheet->setCellValue("{$sigCol}{$footerStartRow}", ($kelompokKkn->lokasi?->village_name ?? '..........................').', '.now()->translatedFormat('d F Y'));
        $sheet->setCellValue("{$sigCol}".($footerStartRow + 1), 'Kepala Desa/Lurah,');
        $sheet->setCellValue("{$sigCol}".($footerStartRow + 5), '.........................................................');
        $sheet->setCellValue("{$sigCol}".($footerStartRow + 6), 'NIP.');

        $sheet->getColumnDimension('A')->setWidth(5);
        $sheet->getColumnDimension('B')->setWidth(45);
        $sheet->getColumnDimension('C')->setWidth(20);
        $sheet->getColumnDimension('D')->setWidth(15);
        $sheet->getColumnDimension('E')->setWidth(15);
        $sheet->getColumnDimension('F')->setWidth(15);
    }

    public function populateSheetBulk($sheet, array $students, ?int $periodId)
    {
        $sheet->mergeCells('A1:G1');
        $sheet->setCellValue('A1', 'DATABASE NILAI KKN');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells('A2:G2');
        $sheet->setCellValue('A2', 'Angkatan '.($periodId ?? '57').' Tahun '.date('Y'));
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(12);
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $headerRow = 5;
        $headers = ['NO', 'KELOMPOK', 'NAMA MAHASISWA', 'NIM', 'DISIPLIN', 'SIKAP', 'TOTAL NILAI'];
        $cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

        foreach ($headers as $i => $h) {
            $col = $cols[$i];
            $sheet->setCellValue("{$col}{$headerRow}", $h);
            $sheet->getStyle("{$col}{$headerRow}")->getFont()->setBold(true);
            $sheet->getStyle("{$col}{$headerRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        }

        $currentRow = 6;
        foreach ($students as $idx => $student) {
            $sheet->setCellValue("A{$currentRow}", $idx + 1);
            $sheet->setCellValue("B{$currentRow}", $student['group_code']);
            $sheet->setCellValue("C{$currentRow}", $student['name']);
            $sheet->setCellValueExplicit("D{$currentRow}", $student['nim'], DataType::TYPE_STRING);
            $sheet->setCellValue("E{$currentRow}", $student['discipline']);
            $sheet->setCellValue("F{$currentRow}", $student['attitude']);

            if ($student['discipline'] !== null && $student['attitude'] !== null) {
                $total = round(($student['discipline'] + $student['attitude']) / 2);
                $sheet->setCellValue("G{$currentRow}", $total);
            }
            $sheet->getStyle("A{$currentRow}:G{$currentRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
            $currentRow++;
        }
    }
}
