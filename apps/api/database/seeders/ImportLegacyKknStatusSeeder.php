<?php

namespace Database\Seeders;

use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\TahunAkademik;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class ImportLegacyKknStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Path dialihkan ke storage internal Laravel agar mudah di-upload manual di server
        $docsPath = storage_path('Nilai KKN');
        
        if (!File::isDirectory($docsPath)) {
            $this->command->warn("Direktori $docsPath tidak ditemukan.");
            $this->command->line("Silakan upload folder 'Nilai KKN' ke dalam folder 'storage/' di server Anda terlebih dahulu.");
            return;
        }

        // 1. Pastikan ada tahun akademik untuk menampung periode legacy
        $tahunAkademik = TahunAkademik::firstOrCreate(
            ['year' => '2023/2024'],
            ['is_active' => false]
        );

        // 2. Buat atau cari periode "Legacy" untuk menampung data mahasiswa lama
        $periode = Periode::firstOrCreate(
            ['name' => 'KKN Historis (Legacy)'],
            [
                'academic_year_id' => $tahunAkademik->id,
                'jenis_kkn_id' => 1, // Default ke Reguler
                'registration_start' => now()->subYears(2),
                'registration_end' => now()->subYears(2),
                'start_date' => now()->subYears(2),
                'end_date' => now()->subYears(2),
                'is_active' => false,
            ]
        );

        $directories = File::directories($docsPath);
        $totalImported = 0;
        $notFound = 0;

        $this->command->info('Mulai mengekstrak data dari folder /storage/Nilai KKN...');

        foreach ($directories as $dir) {
            if (!str_ends_with($dir, '.fld')) {
                continue;
            }

            $sheetFile = $dir . '/sheet001.html';
            if (!File::exists($sheetFile)) {
                continue;
            }

            $html = File::get($sheetFile);

            // 2. Regex untuk mengekstrak semua NIM dari format HTML Excel
            preg_match_all('/>\s*`?(\d{8,15})\s*</', $html, $matches);

            if (empty($matches[1])) {
                continue;
            }

            // Hilangkan duplikasi NIM jika ada dalam satu file
            $nims = array_unique($matches[1]);

            foreach ($nims as $nim) {
                // 3. Pastikan mahasiswa sudah tersinkronisasi di sistem
                $mahasiswa = Mahasiswa::where('nim', $nim)->first();

                if ($mahasiswa) {
                    // 4. Catat atau perbarui status peserta menjadi 'completed' (Lulus)
                    PesertaKkn::updateOrCreate(
                        [
                            'mahasiswa_id' => $mahasiswa->id,
                        ],
                        [
                            'periode_id' => $periode->id,
                            'status' => 'completed',
                            'role' => 'Anggota',
                            'notes' => 'Lulus KKN (Diimpor otomatis dari riwayat Excel lama)',
                            'approved_at' => now(),
                            'registration_date' => now()->subYears(2),
                        ]
                    );
                    $totalImported++;
                } else {
                    $notFound++;
                }
            }
        }

        $this->command->info("Selesai! $totalImported mahasiswa berhasil ditandai LULUS KKN.");
        
        if ($notFound > 0) {
            $this->command->warn("$notFound NIM dari Excel tidak ditemukan di database tabel Mahasiswa.");
            $this->command->line("Pastikan Anda sudah menjalankan Sync Master API (php artisan kkn:sync-master) agar seluruh profil mahasiswa masuk ke database lokal.");
        }
    }
}
