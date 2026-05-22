<?php

declare(strict_types=1);

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PesertaKknFullExport implements FromCollection, ShouldAutoSize, WithHeadings, WithStyles
{
    public function __construct(private $rows) {}

    public function collection() { return collect($this->rows); }

    public function headings(): array
    {
        return [
            registration_id,status_pendaftaran,tanggal_daftar,approved_at,nim,nama,email,phone,alamat,nik,ibu_kandung,jenis_kelamin,tempat_lahir,tanggal_lahir,status_nikah,ukuran_kaos,angkatan,semester,sks,ipk,status_bta_ppi,is_paid_ukt,status_aktif,is_eligible,fakultas_id,fakultas,prodi_id,prodi,periode_id,periode,jenis_kkn_id,jenis_kkn,kelompok_id,kelompok,role_kelompok
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [1 => ['font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']], 'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => '0F766E']]]];
    }
}
