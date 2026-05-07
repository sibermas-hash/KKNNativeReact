<?php

namespace Database\Seeders;

use App\Models\KKN\Dosen;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Carbon\Carbon;

class ImportDb2DosenSeeder extends Seeder
{
    /**
     * Impor data lengkap dosen dari dokumen DB2 (ekspor HTML Excel)
     * ke tabel dosen SIBERMAS, menggunakan NIP/NIDN sebagai kunci pencocokan.
     */
    public function run(): void
    {
        $sheetFile = storage_path('DB2/DB2.fld/sheet001.html');

        if (!File::exists($sheetFile)) {
            $this->command->error("File tidak ditemukan: {$sheetFile}");
            return;
        }

        $this->command->info('Membaca database dosen dari DB2...');
        $html = File::get($sheetFile);

        preg_match_all('/<tr[^>]*>(.*?)<\/tr>/is', $html, $rowMatches);
        $rows = $rowMatches[1] ?? [];

        if (count($rows) < 2) {
            $this->command->error('Tidak ditemukan data baris.');
            return;
        }

        // Pre-load semua dosen ke memori
        // Database menyimpan NIP (18 digit) ATAU NIDN (10 digit) di kolom `nip`
        $dosenByNip = [];
        foreach (Dosen::all() as $d) {
            $cleanNip = preg_replace('/\s+/', '', $d->nip);
            $dosenByNip[$cleanNip] = $d;
        }
        $this->command->info('Total dosen di database: ' . count($dosenByNip));

        $updatedCount = 0;
        $skippedCount = 0;

        foreach ($rows as $rowHtml) {
            preg_match_all('/<td[^>]*>(.*?)<\/td>/is', $rowHtml, $cellMatches);
            $cells = $cellMatches[1] ?? [];

            if (count($cells) < 17) {
                continue;
            }

            $clean = array_map(function ($cell) {
                $text = strip_tags($cell);
                $text = html_entity_decode($text, ENT_QUOTES, 'UTF-8');
                $text = preg_replace('/\s+/', ' ', $text);
                return trim($text);
            }, $cells);

            $no = $clean[0] ?? '';
            if (!is_numeric($no) || empty($clean[1] ?? '')) {
                continue;
            }

            // Validasi: kolom gender (index 8) harus L atau P
            $genderCheck = strtoupper(trim($clean[8] ?? ''));
            if (!in_array($genderCheck, ['L', 'P'])) {
                $skippedCount++;
                continue;
            }

            // Ekstrak NIP (kolom 3, 18 digit) dan NIDN (kolom 4, 10 digit)
            $nipClean = preg_replace('/\s+/', '', $clean[3] ?? '');
            $nidn = trim($clean[4] ?? '');

            // Strategi pencocokan berlapis:
            // 1. Cari berdasarkan NIP 18 digit
            // 2. Jika gagal, cari berdasarkan NIDN (karena Master API kadang menyimpan NIDN di kolom nip)
            $dosen = $dosenByNip[$nipClean] ?? null;

            if (!$dosen && !empty($nidn)) {
                $dosen = $dosenByNip[$nidn] ?? null;
            }

            // 3. Fallback: cari nama yang mirip (fuzzy) jika NIP & NIDN tidak ditemukan
            if (!$dosen) {
                $namaBersih = strtolower(trim($clean[1] ?? ''));
                if (strlen($namaBersih) > 3) {
                    foreach ($dosenByNip as $d) {
                        $dbNama = strtolower(preg_replace('/,.*$/', '', $d->nama));
                        // Hapus gelar dari nama database
                        $dbNama = preg_replace('/^(prof\.|dr\.|h\.|hj\.|ir\.|drs\.|dra\.)\s*/i', '', $dbNama);
                        $dbNama = preg_replace('/^(prof\.|dr\.|h\.|hj\.|ir\.|drs\.|dra\.)\s*/i', '', $dbNama);
                        $dbNama = trim($dbNama);

                        if ($dbNama === $namaBersih || str_contains($dbNama, $namaBersih) || str_contains($namaBersih, $dbNama)) {
                            $dosen = $d;
                            break;
                        }
                    }
                }
            }

            if (!$dosen) {
                $skippedCount++;
                continue;
            }

            try {
                $fieldsToFill = [];

                // Kolom baru (selalu diisi)
                $this->fillIfNotEmpty($fieldsToFill, 'nama_gelar', $clean[2] ?? '');
                $this->fillIfNotEmpty($fieldsToFill, 'nidn', $nidn);
                $this->fillIfNotEmpty($fieldsToFill, 'nik', $clean[5] ?? '');
                $this->fillIfNotEmpty($fieldsToFill, 'pangkat', $clean[9] ?? '');
                $this->fillIfNotEmpty($fieldsToFill, 'tugas_tambahan', $clean[13] ?? '');
                $this->fillIfNotEmpty($fieldsToFill, 'pendidikan_terakhir', $clean[14] ?? '');
                $this->fillIfNotEmpty($fieldsToFill, 'tempat_lahir', $clean[18] ?? '');
                $this->fillIfNotEmpty($fieldsToFill, 'alamat', $clean[20] ?? '');

                $kelasJab = $clean[12] ?? '';
                if (is_numeric($kelasJab)) {
                    $fieldsToFill['kelas_jabatan'] = (int)$kelasJab;
                }

                $pensiunDate = $this->parseDate($clean[17] ?? '');
                if ($pensiunDate) $fieldsToFill['tanggal_pensiun'] = $pensiunDate;

                $birthDate = $this->parseDate($clean[19] ?? '');
                if ($birthDate && empty($dosen->birth_date)) $fieldsToFill['birth_date'] = $birthDate;

                // Kolom lama: hanya isi jika masih kosong + validasi format
                $golVal = trim($clean[10] ?? '');
                if (empty($dosen->golongan) && preg_match('/^(I|II|III|IV|V)\//', $golVal)) {
                    $fieldsToFill['golongan'] = $golVal;
                }
                if (empty($dosen->jabatan))         $this->fillIfNotEmpty($fieldsToFill, 'jabatan', $clean[11] ?? '');
                if (empty($dosen->gender))          $fieldsToFill['gender'] = $genderCheck;
                // Phone harus numerik dan max 20 karakter (bukan email)
                $phoneVal = trim($clean[21] ?? '');
                if (empty($dosen->phone) && preg_match('/^[\d\+\-\s]+$/', $phoneVal) && strlen($phoneVal) <= 20) {
                    $fieldsToFill['phone'] = $phoneVal;
                }
                if (empty($dosen->status_pegawai))  $this->fillIfNotEmpty($fieldsToFill, 'status_pegawai', $clean[6] ?? '');

                if (!empty($fieldsToFill)) {
                    $dosen->update($fieldsToFill);
                    $updatedCount++;
                }
            } catch (\Exception $e) {
                $skippedCount++;
                $this->command->warn("Error: {$clean[1]} - " . $e->getMessage());
            }
        }

        $this->command->newLine();
        $this->command->info("Selesai! {$updatedCount} dosen berhasil diperbarui dari DB2.");
        if ($skippedCount > 0) {
            $this->command->warn("{$skippedCount} baris dilewati.");
        }
    }

    private function fillIfNotEmpty(array &$fields, string $key, string $value): void
    {
        $value = trim($value);
        if (!empty($value)) {
            $fields[$key] = $value;
        }
    }

    private function parseDate(?string $raw): ?string
    {
        if (empty($raw)) return null;
        try {
            if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $raw, $m)) {
                return Carbon::createFromDate((int)$m[3], (int)$m[2], (int)$m[1])->toDateString();
            }
        } catch (\Exception $e) {}
        return null;
    }
}
