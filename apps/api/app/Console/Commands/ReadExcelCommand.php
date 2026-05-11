<?php

namespace App\Console\Commands;

use App\Models\KKN\Dosen;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class ReadExcelCommand extends Command
{
    protected $signature = 'debug:workshop-check';
    protected $description = 'Cross-check nama workshop yang gagal cocok dengan database dosen';

    public function handle()
    {
        // Nama-nama yang gagal dipasangkan dari Workshop seeder
        $failedNames = [
            'Adil Mu\'allim',
            'Edi Pujiyono',
            'Faisal Almahdibrata',
            'Prof. Dr. Rubaidi, M.Ag.',
            'Achmad Room Fitrianto',
            'Agus Afandi',
            'Diah Sari Destiana',
            'M. Hikamudin',
            'Sumarseno',
            'Indri Yunita',
            'Hernik Farisia',
            'Ade Gunawan',
            'Agit Yanuar',
            'Andi Rachman',
            'Fatwa Ahi Kurniawan',
            'M. Ridlo Nur Ar-Rofi',
            'Masngudi',
            'Muhammad Wahyudin Rizal',
            'Nur Ismi Hudayanti',
            'Pujiati',
            'Saeful Arifin',
            'Syamsul Bakhri',
            'Turyatin',
            'Uswatun Chasanah',
            'Widia Agustiani',
        ];

        $results = [];

        foreach ($failedNames as $name) {
            // Bersihkan nama dari gelar
            $clean = preg_replace('/,.*$/', '', $name);
            $clean = preg_replace('/^(Prof\.|Dr\.|H\.|Hj\.|Ir\.|Drs\.|Dra\.|K\.?H\.?)\s*/i', '', trim($clean));
            $clean = preg_replace('/^(Prof\.|Dr\.|H\.|Hj\.|Ir\.|Drs\.|Dra\.|K\.?H\.?)\s*/i', '', trim($clean));
            $clean = trim($clean);

            // Pecah nama menjadi kata-kata untuk pencarian
            $words = explode(' ', $clean);
            $firstWord = $words[0] ?? '';
            $lastWord = end($words);

            // Cari di database
            $candidates = Dosen::where(function ($q) use ($clean, $firstWord, $lastWord, $words) {
                // LIKE search dengan kata pertama + terakhir
                $q->where('nama', 'ILIKE', "%{$clean}%")
                  ->orWhere('nama_gelar', 'ILIKE', "%{$clean}%");
                
                // Jika nama lebih dari 1 kata, coba gabungan
                if (count($words) >= 2) {
                    $q->orWhere('nama', 'ILIKE', "%{$lastWord}%");
                }
            })->get(['id', 'nip', 'nama', 'nama_gelar', 'has_workshop']);

            $status = $candidates->isEmpty() ? '❌ TIDAK ADA DI DB' : '⚠️ MUNGKIN COCOK';
            $line = "{$status} | HTM: [{$name}] Cari: [{$clean}]";
            
            if ($candidates->isNotEmpty()) {
                foreach ($candidates as $c) {
                    $ws = $c->has_workshop ? '✅WS' : '❌WS';
                    $line .= "\n     → DB: [{$c->nama}] Gelar: [{$c->nama_gelar}] NIP: [{$c->nip}] {$ws}";
                }
            }
            
            $results[] = $line;
        }

        File::put(storage_path('workshop_check.txt'), implode("\n\n", $results));
        $this->info('Hasil ditulis ke storage/workshop_check.txt');
    }
}
