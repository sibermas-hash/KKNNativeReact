<?php

declare(strict_types=1);

namespace App\Exports;

use App\Models\KKN\InterviewParticipant;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;

class InterviewResultExport implements FromQuery, ShouldAutoSize, WithHeadings, WithMapping, WithTitle
{
    public function __construct(
        private readonly ?int $scheduleId = null,
        private readonly ?int $periodeId = null,
    ) {}

    public function query()
    {
        $query = InterviewParticipant::with([
            'pesertaKkn.mahasiswa.prodi',
            'pesertaKkn.mahasiswa.fakultas',
            'schedule.periode.jenisKkn',
            'processedBy',
        ]);

        if ($this->scheduleId) {
            $query->where('interview_schedule_id', $this->scheduleId);
        }

        if ($this->periodeId) {
            $query->whereHas('schedule', fn ($q) => $q->where('periode_id', $this->periodeId));
        }

        return $query->orderBy('id');
    }

    public function headings(): array
    {
        return [
            'No',
            'NIM',
            'Nama',
            'Prodi',
            'Fakultas',
            'Jenis KKN',
            'Tanggal Wawancara',
            'Waktu',
            'Lokasi',
            'Hasil',
            'Catatan',
            'Penilai',
            'Tanggal Penilaian',
        ];
    }

    public function map($row): array
    {
        static $no = 0;
        $no++;

        $mhs = $row->pesertaKkn?->mahasiswa;
        $schedule = $row->schedule;

        return [
            $no,
            $mhs?->nim ?? '-',
            $mhs?->nama ?? '-',
            $mhs?->prodi?->nama ?? '-',
            $mhs?->fakultas?->nama ?? '-',
            $schedule?->periode?->jenisKkn?->name ?? '-',
            $schedule?->interview_date?->format('d/m/Y') ?? '-',
            ($schedule?->interview_time_start?->format('H:i') ?? '').' - '.($schedule?->interview_time_end?->format('H:i') ?? ''),
            $schedule?->location ?? '-',
            match ($row->result) {
                'passed' => 'LULUS',
                'failed' => 'TIDAK LULUS',
                default => 'PENDING',
            },
            $row->notes ?? '-',
            $row->processedBy?->name ?? '-',
            $row->processed_at?->format('d/m/Y H:i') ?? '-',
        ];
    }

    public function title(): string
    {
        return 'Hasil Wawancara';
    }
}
