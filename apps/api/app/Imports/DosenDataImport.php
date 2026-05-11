<?php

declare(strict_types=1);

namespace App\Imports;

use App\Models\KKN\Dosen;
use Carbon\Carbon;
use DOMDocument;

/**
 * Import data dosen dari file HTML (Excel-to-HTML export).
 * Hanya mengisi field yang KOSONG di database (tidak overwrite data yang sudah ada).
 * Matching berdasarkan NIP.
 */
class DosenDataImport
{
    public int $updatedCount = 0;

    public int $skippedCount = 0;

    public int $notFoundCount = 0;

    public array $notFoundDetails = [];

    // Column index mapping from DB2 HTML
    private const COL_NAMA_TANPA_GELAR = 1;

    private const COL_NAMA_DENGAN_GELAR = 2;

    private const COL_NIP = 3;

    private const COL_NIDN = 4;

    private const COL_NIK = 5;

    private const COL_STATUS_KEPEGAWAIAN = 6;

    private const COL_GENDER = 8;

    private const COL_PANGKAT = 9;

    private const COL_GOLONGAN = 10;

    private const COL_JABATAN = 11;

    private const COL_KELAS_JABATAN = 12;

    private const COL_TUGAS_TAMBAHAN = 13;

    private const COL_TEMPAT_LAHIR = 18;

    private const COL_TANGGAL_LAHIR = 19;

    private const COL_ALAMAT = 20;

    private const COL_NO_HP = 21;

    private const COL_EMAIL = 22;

    private const COL_NO_REKENING = 23; // BRI first, then BNI, BSI, Lainnya

    private const COL_NAMA_REKENING = 24;

    private const COL_NO_HP_WA = 32;

    public function import(string $htmlFilePath): void
    {
        $html = file_get_contents($htmlFilePath);
        if (! $html) {
            return;
        }

        $dom = new DOMDocument;
        @$dom->loadHTML($html);
        $rows = $dom->getElementsByTagName('tr');

        // Skip header row (index 0) and category rows
        for ($i = 1; $i < $rows->length; $i++) {
            $cells = $rows->item($i)->getElementsByTagName('td');

            if ($cells->length < 10) {
                continue; // Skip category separator rows
            }

            $nip = $this->cleanNip(trim($cells->item(self::COL_NIP)->textContent ?? ''));
            if (empty($nip)) {
                $this->skippedCount++;

                continue;
            }

            $dosen = Dosen::whereBlind('nip', (string) $nip)->first();
            if (! $dosen) {
                $this->notFoundCount++;
                $this->notFoundDetails[] = [
                    'nip' => $nip,
                    'nama' => trim($cells->item(self::COL_NAMA_DENGAN_GELAR)->textContent ?? ''),
                ];

                continue;
            }

            $updated = $this->fillEmptyFields($dosen, $cells);
            if ($updated) {
                $this->updatedCount++;
            } else {
                $this->skippedCount++;
            }
        }
    }

    private function fillEmptyFields(Dosen $dosen, \DOMNodeList $cells): bool
    {
        $changes = [];

        $this->fillIfEmpty($changes, $dosen, 'nidn', $this->cellValue($cells, self::COL_NIDN));
        $this->fillIfEmpty($changes, $dosen, 'nik', $this->cellValue($cells, self::COL_NIK));
        $this->fillIfEmpty($changes, $dosen, 'nama_gelar', $this->cellValue($cells, self::COL_NAMA_DENGAN_GELAR));
        $this->fillIfEmpty($changes, $dosen, 'gender', $this->cellValue($cells, self::COL_GENDER));
        $this->fillIfEmpty($changes, $dosen, 'pangkat', $this->cellValue($cells, self::COL_PANGKAT));
        $this->fillIfEmpty($changes, $dosen, 'golongan', $this->cellValue($cells, self::COL_GOLONGAN));
        $this->fillIfEmpty($changes, $dosen, 'jabatan', $this->cellValue($cells, self::COL_JABATAN));
        $this->fillIfEmpty($changes, $dosen, 'kelas_jabatan', $this->cellValue($cells, self::COL_KELAS_JABATAN));
        $this->fillIfEmpty($changes, $dosen, 'tugas_tambahan', $this->cellValue($cells, self::COL_TUGAS_TAMBAHAN));
        $this->fillIfEmpty($changes, $dosen, 'tempat_lahir', $this->cellValue($cells, self::COL_TEMPAT_LAHIR));
        $this->fillIfEmpty($changes, $dosen, 'alamat', $this->cellValue($cells, self::COL_ALAMAT));
        $this->fillIfEmpty($changes, $dosen, 'status_pegawai', $this->cellValue($cells, self::COL_STATUS_KEPEGAWAIAN));

        // Rekening: ambil yang pertama tersedia (BRI > BNI > BSI > Lainnya)
        if (empty($dosen->no_rekening)) {
            for ($offset = 0; $offset < 4; $offset++) {
                $noRek = $this->cellValue($cells, self::COL_NO_REKENING + ($offset * 2));
                if (! empty($noRek)) {
                    $changes['no_rekening'] = $noRek;
                    $namaRek = $this->cellValue($cells, self::COL_NAMA_REKENING + ($offset * 2));
                    if (! empty($namaRek)) {
                        $changes['nama_bank'] = match ($offset) {
                            0 => 'BRI',
                            1 => 'BNI',
                            2 => 'BSI',
                            default => $this->cellValue($cells, 30) ?: 'Lainnya', // Bank Rekening Lainnya
                        };
                    }
                    break;
                }
            }
        }

        // Tanggal lahir (format bisa bervariasi)
        if (empty($dosen->birth_date)) {
            $tglLahir = $this->cellValue($cells, self::COL_TANGGAL_LAHIR);
            if (! empty($tglLahir)) {
                try {
                    $changes['birth_date'] = Carbon::parse($tglLahir)->toDateString();
                } catch (\Throwable) {
                    // Skip invalid date
                }
            }
        }

        // Update user phone if empty
        if ($dosen->user && empty($dosen->user->phone)) {
            $phone = $this->cellValue($cells, self::COL_NO_HP) ?: $this->cellValue($cells, self::COL_NO_HP_WA);
            if (! empty($phone)) {
                $dosen->user->update(['phone' => $phone]);
            }
        }

        if (empty($changes)) {
            return false;
        }

        $dosen->update($changes);

        return true;
    }

    private function fillIfEmpty(array &$changes, Dosen $dosen, string $field, ?string $value): void
    {
        if (empty($dosen->{$field}) && ! empty($value)) {
            $changes[$field] = $value;
        }
    }

    private function cellValue(\DOMNodeList $cells, int $index): ?string
    {
        if ($index >= $cells->length) {
            return null;
        }
        $val = trim($cells->item($index)->textContent ?? '');

        return $val !== '' ? $val : null;
    }

    private function cleanNip(string $nip): string
    {
        // Remove spaces from NIP format "19670815 199203 1 001" → "196708151992031001"
        return preg_replace('/\s+/', '', $nip) ?? '';
    }
}
