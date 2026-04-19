<?php

namespace Database\Seeders;

use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DosenCsvSeeder extends Seeder
{
    /**
     * Seed dosen data from CSV file (dosen_465_seeder_lain.csv).
     * Optimized: batch insert with chunk, minimal queries.
     */
    public function run(): void
    {
        if (! app()->environment('local', 'testing')) {
            $this->command->error('This seeder can only run in local or testing environment.');
            return;
        }

        $csvPath = base_path('dosen_465_seeder_lain.csv');
        if (! file_exists($csvPath)) {
            $this->command->error("CSV file not found: {$csvPath}");
            return;
        }

        $this->command->info('📂 Membaca CSV dosen...');

        // --- 1. Parse CSV ---
        $rows = [];
        $handle = fopen($csvPath, 'r');
        $header = fgetcsv($handle); // Skip header

        while (($data = fgetcsv($handle)) !== false) {
            if (count($data) < 6) continue;

            $rows[] = [
                'nip'       => trim($data[1], '"'),
                'nama'      => trim($data[2], '"'),
                'email'     => trim($data[3], '"'),
                'unit_kerja'=> trim($data[4], '"'),
                'status'    => trim($data[5], '"'),
            ];
        }
        fclose($handle);

        $this->command->info("   Ditemukan " . count($rows) . " baris data.");

        // --- 2. Map Unit_Kerja ke Fakultas ---
        // Mapping Unit 1-10 ke fakultas yang ada di database
        $fakultasAll = Fakultas::pluck('id', 'nama')->toArray();
        $fakultasIds = array_values($fakultasAll);

        // CSV unit -> fakultas mapping
        $unitMap = [];
        foreach ($rows as $row) {
            $unit = $row['unit_kerja'];
            if (isset($unitMap[$unit])) continue;

            // Cek apakah unit_kerja cocok dengan nama fakultas di DB
            $matched = null;
            foreach ($fakultasAll as $nama => $id) {
                if (stripos($unit, $nama) !== false || stripos($nama, $unit) !== false) {
                    $matched = $id;
                    break;
                }
            }

            if ($matched) {
                $unitMap[$unit] = $matched;
            } else {
                // Distribusikan "Unit N" ke fakultas yang ada secara round-robin
                $unitMap[$unit] = $fakultasIds[count($unitMap) % count($fakultasIds)];
            }
        }

        $this->command->info('🏛️  Mapping unit kerja ke ' . count($fakultasIds) . ' fakultas.');

        // --- 3. Deduplicate: skip NIP yang sudah ada ---
        $existingNips = Dosen::pluck('nip')->toArray();
        $existingUsernames = User::pluck('username')->toArray();
        $existingEmails = User::whereNotNull('email')->pluck('email')->toArray();

        $existingNipsFlip = array_flip($existingNips);
        $existingUsernamesFlip = array_flip($existingUsernames);
        $existingEmailsFlip = array_flip($existingEmails);

        $newRows = [];
        $skipped = 0;
        $seenNips = [];
        foreach ($rows as $row) {
            // Skip duplicate NIP dalam CSV sendiri
            if (isset($seenNips[$row['nip']])) {
                $skipped++;
                continue;
            }
            $seenNips[$row['nip']] = true;

            // Skip yang sudah ada di database
            if (isset($existingNipsFlip[$row['nip']])) {
                $skipped++;
                continue;
            }

            $newRows[] = $row;
        }

        $this->command->info("   Baru: " . count($newRows) . " dosen | Dilewati: {$skipped} (duplikat/sudah ada)");

        if (empty($newRows)) {
            $this->command->info('✅ Tidak ada data baru untuk ditambahkan.');
            return;
        }

        // --- 4. Batch insert ---
        $this->command->info('💾 Menyimpan data dosen...');

        $passwordHash = Hash::make(env('KKN_LOCAL_SEED_PASSWORD', 'password'));
        $now = now();
        $bar = $this->command->getOutput()->createProgressBar(count($newRows));

        $dosenBatch = [];
        $userBatch = [];

        foreach ($newRows as $row) {
            $fakultasId = $unitMap[$row['unit_kerja']] ?? $fakultasIds[0];

            // Buat username unik dari NIP
            $username = $row['nip'];
            if (isset($existingUsernamesFlip[$username])) {
                $username = $row['nip'] . '_dpl';
            }

            // Email unik
            $email = $row['email'];
            if (isset($existingEmailsFlip[$email]) || $email === '') {
                $email = Str::slug($row['nama'], '.') . '.' . substr($row['nip'], -4) . '@uinsaizu.ac.id';
            }

            // Track untuk duplikasi dalam batch
            $existingUsernamesFlip[$username] = true;
            $existingEmailsFlip[$email] = true;

            $dosenBatch[] = [
                'nip'             => $row['nip'],
                'nama'            => $row['nama'],
                'fakultas_id'     => $fakultasId,
                'master_synced_at'=> $now,
                'created_at'      => $now,
                'updated_at'      => $now,
            ];

            $userBatch[] = [
                'username'             => $username,
                'name'                 => $row['nama'],
                'email'                => $email,
                'password'             => $passwordHash,
                'is_active'            => $row['status'] === 'aktif',
                'must_change_password' => true,
                'fakultas_id'          => $fakultasId,
                'created_at'           => $now,
                'updated_at'           => $now,
            ];
        }

        DB::beginTransaction();
        try {
            // Insert users first (same physical DB as kkn)
            foreach (array_chunk($userBatch, 100) as $chunk) {
                DB::table('users')->insert($chunk);
            }

            // Insert dosen in chunks
            foreach (array_chunk($dosenBatch, 100) as $chunk) {
                DB::table('dosen')->insert($chunk);
                $bar->advance(count($chunk));
            }

            // Link dosen -> user_id via raw SQL (same DB, avoids cross-connection FK issues)
            $this->command->newLine();
            $this->command->info('🔗 Menghubungkan akun dosen...');

            DB::statement('
                UPDATE dosen SET user_id = u.id, updated_at = NOW()
                FROM users u WHERE dosen.nip = u.username AND dosen.user_id IS NULL
            ');

            // Batch assign DPL role
            $dplRole = DB::table('roles')->where('name', 'dpl')->value('id');

            $dosenUserIds = DB::table('dosen')
                ->whereNotNull('user_id')
                ->pluck('user_id')
                ->toArray();

            $existingRoleIds = DB::table('model_has_roles')
                ->where('role_id', $dplRole)
                ->whereIn('model_id', $dosenUserIds)
                ->pluck('model_id')
                ->toArray();

            $roleInserts = [];
            foreach ($dosenUserIds as $uid) {
                if (! in_array($uid, $existingRoleIds)) {
                    $roleInserts[] = [
                        'role_id'    => $dplRole,
                        'model_type' => User::class,
                        'model_id'   => $uid,
                    ];
                }
            }

            if (! empty($roleInserts)) {
                foreach (array_chunk($roleInserts, 100) as $chunk) {
                    DB::table('model_has_roles')->insertOrIgnore($chunk);
                }
            }

            DB::commit();
            $bar->finish();

            $this->command->newLine(2);
            $this->command->info('✅ Selesai! ' . count($newRows) . ' dosen berhasil ditambahkan.');
            $this->command->info('');
            $this->command->info('📊 Ringkasan:');
            $this->command->info('   👨‍🏫 Total dosen di DB: ' . Dosen::count());
            $this->command->info('   👤 Total akun DPL: ' . User::role('dpl')->count());
            $this->command->info('   🔑 Password: [KKN_LOCAL_SEED_PASSWORD] atau "password"');
            $this->command->info('   📧 Username: [NIP dosen]');

        } catch (\Throwable $e) {
            DB::rollBack();
            $this->command->error('❌ Gagal: ' . $e->getMessage());
            throw $e;
        }
    }
}
