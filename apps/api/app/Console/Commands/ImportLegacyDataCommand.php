<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;

class ImportLegacyDataCommand extends Command
{
    protected $signature = 'kkn:import-legacy {--force : Force the operation to run when in production} {--clean : Delete legacy source folders after a successful import}';
    
    protected $description = 'Import legacy KKN and DPL data from uploaded HTML/Excel exports in storage/';

    public function handle()
    {
        $this->info("Memulai proses deployment sinkronisasi data Legacy SIBERMAS...");

        $storagePath = storage_path();
        $directories = [
            'DB2' => $storagePath . '/DB2',
            'DPL' => $storagePath . '/DPL',
            'Nilai KKN' => $storagePath . '/Nilai KKN',
        ];

        // 1. Verifikasi direktori ada
        $missing = false;
        foreach ($directories as $name => $path) {
            if (!File::isDirectory($path)) {
                $this->error("Direktori 'storage/{$name}' tidak ditemukan. Pastikan Anda telah mengunggah file tersebut.");
                $missing = true;
            }
        }

        if ($missing) {
            return 1;
        }

        $this->info('✅ Direktori legacy ditemukan.');

        // 2. Jalankan Migrations
        $this->info("\n--- Menjalankan Migrasi Database ---");
        Artisan::call('migrate', ['--force' => true], $this->getOutput());

        // 3. Sync Master API
        $this->info("\n--- Menyinkronkan Master Data SIAKAD ---");
        $this->info("(Harap tunggu, proses ini mungkin membutuhkan waktu 1-2 menit)");
        Artisan::call('kkn:sync-master', [], $this->getOutput());

        // 4. Jalankan Seeders
        $this->info("\n--- Mengimpor Data Legacy KKN Mahasiswa ---");
        Artisan::call('db:seed', ['--class' => 'ImportLegacyKknStatusSeeder', '--force' => true], $this->getOutput());

        $this->info("\n--- Mengimpor Status Workshop Dosen ---");
        Artisan::call('db:seed', ['--class' => 'ImportWorkshopDplSeeder', '--force' => true], $this->getOutput());

        $this->info("\n--- Mengimpor Detail Profil Dosen dari DB2 ---");
        Artisan::call('db:seed', ['--class' => 'ImportDb2DosenSeeder', '--force' => true], $this->getOutput());

        // 5. Patch Manual Anomali (Hikamudin)
        $this->info("\n--- Menjalankan Patching Anomali Data ---");
        \App\Models\KKN\Dosen::where('nip', '2021018302')->update([
            'has_workshop' => true, 
            'workshop_date' => '2024-01-01'
        ]);
        $this->line("Data spesifik (Hikamudin) telah di-patch.");

        // 6. Cleanup (Optional)
        if ($this->option('clean')) {
            $this->info("\n--- Membersihkan File Legacy Sensitif ---");
            foreach ($directories as $name => $path) {
                File::deleteDirectory($path);
                $this->line("Menghapus storage/{$name}...");
            }
            $this->info('✅ File legacy berhasil dihapus.');
        }

        $this->newLine();
        $this->info("✨ DEPLOYMENT DATA LEGACY SELESAI DENGAN SUKSES ✨");
        
        return 0;
    }
}
