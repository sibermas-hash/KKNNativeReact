<?php

declare(strict_types=1);

namespace App\Exports;

use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Ekspor biodata lengkap peserta KKN yang sudah disetujui.
 * Digunakan oleh admin LPPM untuk mendaftarkan mahasiswa ke BPJS Ketenagakerjaan.
 */
class BiodataPesertaExport implements FromQuery, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
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
        return 'Biodata Peserta KKN';
    }

    public function headings(): array
    {
        return [
            'No',
            'Nama Lengkap',
            'NIM',
            'NIK (KTP)',
            'Tempat Lahir',
            'Tanggal Lahir',
            'Jenis Kelamin',
            'Nama Ibu Kandung',
            'Nomor HP / WA',
            'Alamat Lengkap',
            'Desa / Kelurahan',
            'Kecamatan',
            'Kabupaten / Kota',
            'Ukuran Baju / Jaket',
            'IPK',
            'SKS Diselesaikan',
            'Fakultas',
            'Program Studi',
            'Kelompok KKN',
            'Periode KKN',
            'Status Pendaftaran',
        ];
    }

    public function map($row): array
    {
        static $no = 0;
        $no++;

        $mhs = $row->mahasiswa;
        $user = $mhs?->user;

        return [
            $no,
            $mhs?->nama ?? '-',
            $mhs?->nim ?? '-',
            $mhs?->nik ?? '-',
            $mhs?->birth_place ?? '-',
            $mhs?->birth_date ? Carbon::parse($mhs->birth_date)->format('d-m-Y') : '-',
            match ($mhs?->gender) {
                'L' => 'Laki-laki', 'P' => 'Perempuan', default => '-'
            },
            $mhs?->mother_name ?? '-',
            $user?->phone ?? '-',
            $user?->address ?? '-',
            $user?->domicile_village_name ?? '-',
            $user?->domicile_district_name ?? '-',
            $user?->domicile_regency_name ?? '-',
            $mhs?->shirt_size ?? '-',
            $mhs?->gpa !== null ? number_format((float) $mhs->gpa, 2, '.', '') : '-',
            $mhs?->sks_completed ?? '-',
            $mhs?->fakultas?->nama ?? '-',
            $mhs?->prodi?->nama ?? '-',
            $row->kelompok?->nama_kelompok ?? '-',
            $row->periode?->name ?? '-',
            match ($row->status) {
                'approved' => 'Peserta Aktif',
                'rejected' => 'Ditolak',
                'pending' => 'Menunggu Verifikasi',
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
