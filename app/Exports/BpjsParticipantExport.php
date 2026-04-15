<?php

declare(strict_types=1);

namespace App\Exports;

use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class BpjsParticipantExport implements FromQuery, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    private $queryBuilder;

    public function __construct($query)
    {
        $this->queryBuilder = $query;
    }

    public function query()
    {
        return $this->queryBuilder;
    }

    public function title(): string
    {
        return 'Peserta BPJS';
    }

    public function headings(): array
    {
        return [
            'No',
            'Nama',
            'NIM',
            'NIK',
            'IPK',
            'SKS',
            'Nama Ibu',
            'Alamat',
            'No. WA',
            'Fakultas',
            'Prodi',
            'Kelompok',
            'Periode KKN',
            'Status Pendaftaran',
        ];
    }

    public function map($row): array
    {
        static $no = 0;
        $no++;

        return [
            $no,
            $row->mahasiswa?->nama ?? '-',
            $row->mahasiswa?->nim ?? '-',
            $row->mahasiswa?->nik ?? '-',
            $row->mahasiswa?->gpa !== null ? number_format((float) $row->mahasiswa->gpa, 2, '.', '') : '-',
            $row->mahasiswa?->sks_completed ?? '-',
            $row->mahasiswa?->mother_name ?? '-',
            $row->mahasiswa?->user?->address ?? '-',
            $row->mahasiswa?->user?->phone ?? '-',
            $row->mahasiswa?->fakultas?->nama ?? $row->mahasiswa?->prodi?->fakultas?->nama ?? '-',
            $row->mahasiswa?->prodi?->nama ?? '-',
            $row->kelompok?->nama_kelompok ?? '-',
            $row->periode?->name ?? '-',
            match ($row->status) {
                'approved' => 'Disetujui',
                'rejected' => 'Ditolak',
                'pending' => 'Menunggu',
                default => ucfirst((string) $row->status),
            },
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['argb' => 'FF166534']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }
}
