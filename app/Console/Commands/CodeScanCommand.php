<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\AI\CodeGuardianService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class CodeScanCommand extends Command
{
    protected $signature = 'guardian:scan {path=app/Models/KKN} {--force : Jalankan perbaikan tanpa konfirmasi}';
    protected $description = 'Deteksi otomatis kode busuk menggunakan AI';

    public function handle(CodeGuardianService $guardian): void
    {
        $path = base_path($this->argument('path'));
        if (!File::isDirectory($path)) {
            $this->error("Path tidak ditemukan: {$path}");
            return;
        }
        
        $files = File::allFiles($path);
        $force = $this->option('force');

        $this->info("🔍 Memulai pemindaian pada " . count($files) . " file...");

        foreach ($files as $file) {
            $this->warn("Scanning: " . $file->getRelativePathname());
            
            try {
                $analysis = $guardian->scan($file->getRealPath());

                if ($analysis['issue_found'] ?? false) {
                    $this->error("🚨 Masalah ditemukan! Severity: " . strtoupper($analysis['severity']));
                    $this->line("Deskripsi: " . $analysis['description']);
                    
                    if ($force || $this->confirm("Apakah Anda ingin AI memperbaiki file ini secara otomatis?")) {
                        if ($guardian->heal($file->getRealPath(), $analysis['suggestion'])) {
                            $this->info("✅ File berhasil diperbaiki dan dibackup (.bak)");
                        }
                    }
                } else {
                    $this->info("✅ File bersih.");
                }
            } catch (\Exception $e) {
                $this->error("❌ Gagal memproses file: " . $e->getMessage());
            }
            $this->newLine();
        }

        $this->info("🏁 Pemindaian selesai.");
    }
}
