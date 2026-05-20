<?php

declare(strict_types=1);

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PendaftarApprovedDokumentasiExport implements FromCollection, ShouldAutoSize, WithHeadings, WithStyles
{
    public function __construct(private $rows) {}

    public function collection()
    {
        return collect($this->rows);
    }

    public function headings(): array
    {
        return [
            'no', 'registration_id', 'nim', 'nama', 'email', 'no_wa', 'fakultas', 'prodi', 'angkatan', 'semester', 'sks', 'ipk', 'status_bta_ppi', 'status_aktif', 'jenis_kkn', 'periode', 'status_pendaftaran', 'tanggal_daftar', 'tanggal_approve_dokumen', 'approved_by', 'catatan_approval', 'dokumen_terunggah', 'dokumen_wajib', 'dokumen_kurang',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => '047857']],
            ],
        ];
    }
}
