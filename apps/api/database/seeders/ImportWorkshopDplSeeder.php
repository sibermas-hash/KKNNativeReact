<?php

namespace Database\Seeders;

use App\Models\KKN\Dosen;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class ImportWorkshopDplSeeder extends Seeder
{
    public function run(): void
    {
        $folderPath = storage_path('DPL/Rekap_Peserta_Metodologi_PKM (1).fld');
        $sheetFile = $folderPath . '/sheet001.html';

        if (!File::isDirectory($folderPath) || !File::exists($sheetFile)) {
            $this->command->error("File tidak ditemukan: {$sheetFile}");
            return;
        }

        $this->command->info('Membaca Rekap Peserta Metodologi PKM...');

        $html = File::get($sheetFile);
        preg_match_all('/<td[^>]*width=304[^>]*>(.*?)<\/td>/is', $html, $matches);
        $namesRaw = $matches[1] ?? [];

        // Pre-load semua dosen dengan beberapa variasi nama untuk pencocokan
        $semuaDosen = Dosen::select('id', 'nama', 'nama_gelar', 'nip')->get();

        $updatedCount = 0;
        $notFoundNames = [];

        foreach ($namesRaw as $rawName) {
            $nama = trim(strip_tags($rawName));
            $nama = preg_replace('/\s+/', ' ', $nama);

            if (empty($nama) || strtolower($nama) === 'nama') {
                continue;
            }

            $namaClean = $this->normalizeName($nama);

            if (empty($namaClean)) {
                continue;
            }

            $bestMatch = null;
            $matchFound = false;
            $highestPercent = 0;

            foreach ($semuaDosen as $dosen) {
                // Cek terhadap nama tanpa gelar (kolom `nama`)
                $dosenNamaClean = $this->normalizeName($dosen->nama);

                // A. Exact match
                if ($dosenNamaClean === $namaClean) {
                    $bestMatch = $dosen;
                    $matchFound = true;
                    break;
                }

                // B. Juga cek terhadap nama_gelar (dari DB2)
                if ($dosen->nama_gelar) {
                    $dosenGelarClean = $this->normalizeName($dosen->nama_gelar);
                    if ($dosenGelarClean === $namaClean) {
                        $bestMatch = $dosen;
                        $matchFound = true;
                        break;
                    }
                }

                // C. Substring match (satu nama ada di dalam nama lain)
                if (strlen($namaClean) >= 5 && strlen($dosenNamaClean) >= 5) {
                    if (str_contains($dosenNamaClean, $namaClean) || str_contains($namaClean, $dosenNamaClean)) {
                        $bestMatch = $dosen;
                        $matchFound = true;
                        break;
                    }
                }

                // D. Word-based matching: semua kata dari salah satu nama ada di nama lainnya
                $namaWords = explode(' ', $namaClean);
                $dosenWords = explode(' ', $dosenNamaClean);
                if (count($namaWords) >= 2 && count($dosenWords) >= 2) {
                    $matchedWords = array_intersect($namaWords, $dosenWords);
                    $totalWords = max(count($namaWords), count($dosenWords));
                    $wordMatchPercent = count($matchedWords) / $totalWords * 100;
                    if ($wordMatchPercent >= 80) {
                        $bestMatch = $dosen;
                        $matchFound = true;
                        break;
                    }
                }

                // E. Fuzzy matching (kemiripan teks)
                similar_text($namaClean, $dosenNamaClean, $percent);
                if ($percent > $highestPercent) {
                    $highestPercent = $percent;
                    if ($percent >= 80) {
                        $bestMatch = $dosen;
                    }
                }

                // Juga fuzzy terhadap nama_gelar
                if ($dosen->nama_gelar) {
                    $dosenGelarClean = $this->normalizeName($dosen->nama_gelar);
                    similar_text($namaClean, $dosenGelarClean, $pGelar);
                    if ($pGelar > $highestPercent) {
                        $highestPercent = $pGelar;
                        if ($pGelar >= 80) {
                            $bestMatch = $dosen;
                        }
                    }
                }
            }

            if ($matchFound || $bestMatch) {
                $bestMatch->update([
                    'has_workshop' => true,
                    'workshop_date' => '2024-01-01',
                ]);
                $updatedCount++;

                if (!$matchFound && $bestMatch) {
                    $this->command->line("<fg=yellow>Fuzzy:</> '{$nama}' → <fg=green>{$bestMatch->nama}</> (" . round($highestPercent, 1) . "%)");
                }
            } else {
                $notFoundNames[] = "{$nama} (" . round($highestPercent, 1) . "%)";
            }
        }

        $this->command->newLine();
        $this->command->info("Selesai! {$updatedCount} Dosen berhasil ditandai lulus workshop.");

        if (!empty($notFoundNames)) {
            $this->command->warn(count($notFoundNames) . " nama tidak dapat dipasangkan:");
            foreach ($notFoundNames as $n) {
                $this->command->line("  ✗ {$n}");
            }
            $this->command->newLine();
            $this->command->line("Nama-nama di atas kemungkinan besar adalah <fg=cyan>dosen luar / narasumber</> yang bukan dosen UIN Saizu.");
        }
    }

    /**
     * Normalisasi nama: hapus semua gelar, tanda baca, dan lowercasekan.
     */
    private function normalizeName(string $name): string
    {
        // Hapus semua setelah koma (gelar belakang)
        $name = preg_replace('/,.*$/', '', $name);
        // Hapus gelar depan secara berulang
        for ($i = 0; $i < 3; $i++) {
            $name = preg_replace('/^(Prof|Dr|H|Hj|Ir|Drs|Dra|KH|K\.H)\.?\s*/i', '', trim($name));
        }
        // Hapus gelar belakang umum
        $name = preg_replace('/\s+(S\.?Pd\.?I?|M\.?A\.?g?|M\.?Pd\.?I?|M\.?Hum|M\.?Si|M\.?E|M\.?Kom|M\.?H|M\.?S\.?I|Lc|S\.?Fil|S\.?E\.?Sy|S\.?Sos|S\.?H\.?I|M\.?Pharm\.?Sci|S\.?Psi|S\.?S|S\.?Th\.?I)\.?\s*$/i', '', $name);
        // Hapus titik dan tanda kutip
        $name = str_replace(['.', "'", "'", '`', '"'], '', $name);
        // Lowercase + trim spasi berlebih
        $name = strtolower(trim(preg_replace('/\s+/', ' ', $name)));
        return $name;
    }
}
