<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\{FromCollection, WithHeadings, WithStyles, WithTitle, ShouldAutoSize, WithMapping};
use PhpOffice\PhpSpreadsheet\Style\{Fill, Alignment};
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class RekapNilaiExport implements FromCollection, WithHeadings, WithStyles, WithMapping, WithTitle, ShouldAutoSize
{
    public function __construct(
        private $rows,
        private $periode,
    ) {}

    public function collection(): \Illuminate\Support\Collection
    {
        return $this->rows;
    }

    public function title(): string
    {
        return "Rekap Nilai {$this->periode->name}";
    }

    public function headings(): array
    {
        return [
            'No', 'NIM', 'Nama Mahasiswa', 'Fakultas', 'Prodi',
            'Kelompok', 'Desa', 'DPL',
            // Komponen A
            'Laporan (A1)', 'Pelaksanaan (A2)', 'Artikel (A3)',
            // Komponen B
            'Sikap (B1)', 'Kedisiplinan (B2)',
            // Komponen C
            'Pembekalan (C1)', 'Administrasi (C2)',
            // Output
            'Nilai Akhir', 'Huruf', 'Status',
        ];
    }

    public function map($row): array
    {
        static $no = 0;
        $no++;
        return [
            $no,
            $row->nim,
            $row->nama,
            $row->fakultas,
            $row->prodi,
            $row->kode_kelompok,
            $row->desa,
            $row->nama_dpl,
            $row->nilai_laporan_akhir ?? '-',
            $row->nilai_pelaksanaan ?? '-',
            $row->nilai_artikel ?? '-',
            $row->nilai_sikap ?? '-',
            $row->nilai_kedisiplinan ?? '-',
            $row->nilai_workshop ?? '-',
            $row->nilai_administrasi ?? '-',
            $row->nilai_akhir ?? '-',
            $row->huruf ?? '-',
            $row->is_finalized ? 'Final' : 'Draf',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            // Header row — bold, biru gelap
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => 'FF1E40AF']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
            // Kolom nilai akhir — bold
            'P' => ['font' => ['bold' => true]],
            'Q' => ['font' => ['bold' => true, 'color' => ['argb' => 'FF1E40AF']]],
        ];
    }
}
