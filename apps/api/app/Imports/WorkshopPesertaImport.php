<?php

declare(strict_types=1);

namespace App\Imports;

use App\Models\KKN\Dosen;
use App\Models\KKN\PesertaWorkshop;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

/**
 * Import peserta workshop dari file Excel.
 * Format template: NIP | Nama (opsional, untuk verifikasi visual)
 *
 * Kolom yang dibaca: "nip" (wajib)
 * Dosen dicocokkan berdasarkan NIP di tabel dosen.
 */
class WorkshopPesertaImport implements ToCollection, WithHeadingRow
{
    public int $successCount = 0;

    public int $skippedCount = 0;

    public int $notFoundCount = 0;

    public array $notFoundDetails = [];

    public function __construct(
        private readonly int $workshopId,
    ) {}

    public function collection(Collection $rows): void
    {
        foreach ($rows as $row) {
            $rowArray = is_array($row) ? $row : $row->toArray();

            $nip = trim((string) ($rowArray['nip'] ?? ''));

            if (empty($nip)) {
                $this->skippedCount++;

                continue;
            }

            // Cari dosen berdasarkan NIP
            $dosen = Dosen::whereBlind('nip', (string) $nip)->first();

            if (! $dosen || ! $dosen->user_id) {
                $this->notFoundCount++;
                $this->notFoundDetails[] = [
                    'nip' => $nip,
                    'nama' => trim((string) ($rowArray['nama'] ?? '')),
                ];

                continue;
            }

            // Cek apakah sudah terdaftar di workshop ini
            $exists = PesertaWorkshop::where('workshop_id', $this->workshopId)
                ->where('user_id', $dosen->user_id)
                ->exists();

            if ($exists) {
                $this->skippedCount++;

                continue;
            }

            // Daftarkan dan tandai hadir
            PesertaWorkshop::create([
                'workshop_id' => $this->workshopId,
                'user_id' => $dosen->user_id,
                'registered_at' => now(),
                'attendance_status' => 'attended',
                'is_passed' => true,
                'checked_in_at' => now(),
                'certificate_generated' => false,
            ]);

            // Update flag di dosen
            if (! $dosen->has_workshop) {
                $dosen->update([
                    'has_workshop' => true,
                    'workshop_date' => now()->toDateString(),
                ]);
            }

            $this->successCount++;
        }
    }
}
