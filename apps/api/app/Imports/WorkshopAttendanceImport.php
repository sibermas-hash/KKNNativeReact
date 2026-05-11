<?php

declare(strict_types=1);

namespace App\Imports;

use App\Models\KKN\Dosen;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaWorkshop;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class WorkshopAttendanceImport implements ToCollection, WithHeadingRow
{
    private int $workshopId;

    private string $type; // 'mahasiswa' or 'dosen'

    public int $processedCount = 0;

    public function __construct(int $workshopId, string $type = 'dosen')
    {
        $this->workshopId = $workshopId;
        $this->type = $type;
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            $identifier = match ($this->type) {
                'mahasiswa' => trim((string) ($row['nim'] ?? $row['NIM'] ?? '')),
                'dosen' => trim((string) ($row['nip'] ?? $row['NIP'] ?? '')),
                default => null,
            };

            if (empty($identifier)) {
                continue;
            }

            $userId = match ($this->type) {
                'mahasiswa' => $this->findMahasiswaUserId($identifier),
                'dosen' => $this->findDosenUserId($identifier),
                default => null,
            };

            if ($userId) {
                // Update attendance status directly from Excel import (no online check-in)
                PesertaWorkshop::updateOrCreate(
                    [
                        'workshop_id' => $this->workshopId,
                        'user_id' => $userId,
                    ],
                    [
                        'attendance_status' => 'attended',
                        'checked_in_at' => now(),
                        'is_passed' => true,
                    ]
                );

                $this->processedCount++;
            }
        }
    }

    private function findMahasiswaUserId(string $nim): ?int
    {
        $mahasiswa = Mahasiswa::whereBlind('nim', (string) $nim)->first();

        return $mahasiswa?->user_id;
    }

    private function findDosenUserId(string $nip): ?int
    {
        $dosen = Dosen::whereBlind('nip', (string) $nip)->first();

        return $dosen?->user_id;
    }
}
