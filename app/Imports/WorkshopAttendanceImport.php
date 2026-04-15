<?php

declare(strict_types=1);

namespace App\Imports;

use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaWorkshop;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class WorkshopAttendanceImport implements ToCollection, WithHeadingRow
{
    private int $workshopId;

    public int $processedCount = 0;

    public function __construct(int $workshopId)
    {
        $this->workshopId = $workshopId;
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            // Kita dukung format NIM yang mungkin ada spasi atau karakter aneh
            $nim = trim((string) ($row['nim'] ?? $row['NIM'] ?? ''));

            if (empty($nim)) {
                continue;
            }

            // Cari mahasiswa berdasarkan NIM
            $mahasiswa = Mahasiswa::where('nim', $nim)->first();

            if ($mahasiswa) {
                // Update status di tabel PesertaWorkshop
                // Kolom aslinya adalah 'attended' (boolean) atau 'attended_at' (timestamp)
                // Berdasarkan migrasi yang saya lihat sebelumnya.
                $updated = PesertaWorkshop::where('workshop_id', $this->workshopId)
                    ->where('user_id', $mahasiswa->user_id)
                    ->update([
                        'attended' => true,
                        'attended_at' => now(),
                    ]);

                if ($updated) {
                    $this->processedCount++;
                }
            }
        }
    }
}
