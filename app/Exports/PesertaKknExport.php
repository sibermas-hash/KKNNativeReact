<?php

namespace App\Exports;

use App\Models\KKN\PesertaKkn;
use Illuminate\Database\Query\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PesertaKknExport implements FromQuery, WithHeadings, WithMapping, WithStyles, WithTitle, ShouldAutoSize
{
    protected $queryBuilder;

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
        return 'Pendaftaran KKN';
    }

    public function headings(): array
    {
        return [
            'No',
            'NIM',
            'Nama',
            'Fakultas',
            'Program Studi',
            'Periode KKN',
            'Kelompok',
            'Status',
            'Tanggal Daftar',
        ];
    }

    public function map($reg): array
    {
        static $no = 0;
        $no++;

        return [
            $no,
            $reg->mahasiswa?->nim ?? '-',
            $reg->mahasiswa?->nama ?? '-',
            $reg->mahasiswa?->fakultas?->nama ?? '-',
            $reg->mahasiswa?->prodi?->nama ?? '-',
            $reg->periode?->name ?? '-',
            $reg->kelompok?->nama_kelompok ?? 'Belum ada',
            ucfirst((string) $reg->status),
            $reg->created_at?->format('d M Y H:i') ?? '-',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'color' => ['rgb' => '2563EB'],
                ],
            ],
        ];
    }
}
