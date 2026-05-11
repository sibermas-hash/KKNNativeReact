<?php

declare(strict_types=1);

namespace App\Imports;

use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use DOMDocument;

/**
 * Import nilai KKN historis dari file HTML (Excel-to-HTML export).
 * Menandai mahasiswa sebagai sudah pernah ikut KKN (status = 'completed').
 * Data nilai disimpan untuk referensi.
 *
 * Format HTML: No | Nama DPL | NIM | Nama Mahasiswa | Laporan | Artikel | Pelaksanaan | Kedisiplinan | Sikap | LPPM | Total | Huruf
 */
class NilaiKknHistorisImport
{
    public int $importedCount = 0;

    public int $skippedCount = 0;

    public int $notFoundCount = 0;

    public array $notFoundDetails = [];

    private const COL_NAMA_DPL = 1;

    private const COL_NIM = 2;

    private const COL_NAMA = 3;

    private const COL_LAPORAN = 4;

    private const COL_ARTIKEL = 5;

    private const COL_PELAKSANAAN = 6;

    private const COL_KEDISIPLINAN = 7;

    private const COL_SIKAP = 8;

    private const COL_LPPM = 9;

    private const COL_TOTAL = 10;

    private const COL_HURUF = 11;

    public function __construct(
        private readonly ?int $periodeId = null,
        private readonly string $angkatan = '',
    ) {}

    public function import(string $htmlFilePath): void
    {
        $html = file_get_contents($htmlFilePath);
        if (! $html) {
            return;
        }

        $dom = new DOMDocument;
        @$dom->loadHTML($html);
        $rows = $dom->getElementsByTagName('tr');

        // Find header row (contains "NIM") then process data rows after it
        $headerFound = false;
        for ($i = 0; $i < $rows->length; $i++) {
            $cells = $rows->item($i)->getElementsByTagName('td');

            if (! $headerFound) {
                // Look for header row
                for ($j = 0; $j < $cells->length; $j++) {
                    if (str_contains(trim($cells->item($j)->textContent ?? ''), 'NIM')) {
                        $headerFound = true;
                        break;
                    }
                }

                continue;
            }

            // Process data rows
            if ($cells->length < 8) {
                continue;
            }

            $nim = $this->cleanNim(trim($cells->item(self::COL_NIM)->textContent ?? ''));
            if (empty($nim)) {
                $this->skippedCount++;

                continue;
            }

            $mahasiswa = Mahasiswa::whereBlind('nim', (string) $nim)->first();
            if (! $mahasiswa) {
                $this->notFoundCount++;
                $this->notFoundDetails[] = [
                    'nim' => $nim,
                    'nama' => trim($cells->item(self::COL_NAMA)->textContent ?? ''),
                ];

                continue;
            }

            // Check if already has a completed registration
            $alreadyCompleted = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
                ->where('status', 'completed')
                ->exists();

            if ($alreadyCompleted) {
                $this->skippedCount++;

                continue;
            }

            // Create a historical "completed" registration
            PesertaKkn::updateOrCreate(
                [
                    'mahasiswa_id' => $mahasiswa->id,
                    'periode_id' => $this->periodeId,
                ],
                [
                    'status' => 'completed',
                    'role' => 'anggota',
                    'registration_date' => now(),
                    'approved_at' => now(),
                    'notes' => "Import historis KKN {$this->angkatan}. Nilai: ".$this->cellValue($cells, self::COL_TOTAL).' ('.$this->cellValue($cells, self::COL_HURUF).')',
                ]
            );

            $this->importedCount++;
        }
    }

    private function cleanNim(string $nim): string
    {
        // Remove backtick prefix and spaces
        $nim = ltrim($nim, '`\'');

        return preg_replace('/\s+/', '', $nim) ?? '';
    }

    private function cellValue(\DOMNodeList $cells, int $index): ?string
    {
        if ($index >= $cells->length) {
            return null;
        }

        return trim($cells->item($index)->textContent ?? '') ?: null;
    }
}
