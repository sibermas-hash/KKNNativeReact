<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ImportDosenCsv extends Command
{
    protected $signature = 'kkn:import-dosen {path}';

    protected $description = 'Import Dosen (DPL) data from CSV file';

    public function handle()
    {
        $path = $this->argument('path');

        if (! file_exists($path)) {
            $this->error("File not found: {$path}");
            return 1;
        }

        $this->info('Starting Dosen data import...');

        try {
            $handle = fopen($path, 'r');
            if ($handle === false) {
                $this->error("Could not open file: {$path}");
                return 1;
            }

            // Get header
            $header = fgetcsv($handle);
            
            $count = 0;
            while (($row = fgetcsv($handle)) !== false) {
                if (count($row) < 4) continue;

                $nip = trim((string) $row[1]);
                $nama = trim($row[2]);
                $email = trim($row[3]);
                $unitKerja = trim($row[4]);

                if (empty($nip) || empty($nama)) continue;

                // 1. Create/Update User
                $user = User::updateOrCreate(
                    ['username' => $nip],
                    [
                        'name' => $nama,
                        'email' => $email ?: ($nip . '@uinsaizu.ac.id'),
                        'password' => Hash::make('Password#123'),
                        'is_active' => true,
                    ]
                );

                if (!$user->hasRole('dpl')) {
                    $user->assignRole('dpl');
                }

                // 2. Faculty
                $facultyName = trim($unitKerja);
                $facultyCode = strtoupper(substr($facultyName, 0, 4));
                $faculty = Fakultas::where('nama', $facultyName)->first() 
                    ?? Fakultas::where('code', $facultyCode)->first();
                
                if (!$faculty) {
                    $faculty = Fakultas::create(['nama' => $facultyName, 'code' => $facultyCode . '_' . Str::random(3)]);
                }

                // 3. Create/Update Dosen
                Dosen::updateOrCreate(
                    ['nip' => $nip],
                    [
                        'user_id' => $user->id,
                        'nama' => $nama,
                        'fakultas_id' => $faculty->id,
                    ]
                );

                $count++;
            }

            fclose($handle);

            $this->info("Imported {$count} Dosen records successfully.");

        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
