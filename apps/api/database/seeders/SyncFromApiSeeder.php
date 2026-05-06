<?php

namespace Database\Seeders;

use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;

/**
 * SyncFromApiSeeder
 *
 * Pulls Dosen data from SIAKAD API and upserts into local database.
 * Mahasiswa endpoint currently returns 0 records — skipped.
 *
 * Run standalone: php artisan db:seed --class=SyncFromApiSeeder
 */
class SyncFromApiSeeder extends Seeder
{
    public function run(): void
    {
        $baseUrl = rtrim(config('services.master_api.url', ''), '/');
        $token   = config('services.master_api.token', '');

        if (! $baseUrl || ! $token) {
            $this->command->error('MASTER_API_URL or MASTER_API_TOKEN not set. Aborting.');

            return;
        }

        $this->syncDosen($baseUrl, $token);
    }

    private function syncDosen(string $baseUrl, string $token): void
    {
        $this->command->info('Syncing Dosen from SIAKAD API...');

        // Build complete faculty map: master_id, nama, dan code → local id
        // Handles API duplicates (e.g. "Dakwah" dan "FDAK" → fakultas yang sama)
        $facultyMap = [];
        foreach (Fakultas::all() as $f) {
            if ($f->master_id) {
                $facultyMap[$f->master_id] = $f->id;
            }
            $facultyMap[$f->nama] = $f->id;
            if ($f->code) {
                $facultyMap[$f->code] = $f->id;
            }
        }

        $page    = 1;
        $perPage = 100;
        $synced  = 0;
        $skipped = 0;
        $errors  = 0;

        do {
            $response = Http::withToken($token)
                ->acceptJson()
                ->withOptions(['verify' => false])
                ->timeout(30)
                ->get("{$baseUrl}/sync/dosen", ['page' => $page, 'per_page' => $perPage]);

            if (! $response->successful()) {
                $this->command->error("HTTP {$response->status()} on page {$page}. Stopping.");
                break;
            }

            $payload  = $response->json();
            $items    = $payload['data'] ?? [];
            $lastPage = $payload['meta']['last_page'] ?? 1;

            foreach ($items as $d) {
                try {
                    $fakultasId = null;
                    if (! empty($d['fakultas_id'])) {
                        $fakultasId = $facultyMap[$d['fakultas_id']] ?? null;
                    }

                    // Skip dosen tanpa fakultas (DB constraint: NOT NULL)
                    if (! $fakultasId) {
                        $skipped++;
                        continue;
                    }

                    Dosen::updateOrCreate(
                        ['nip' => $d['nip']],
                        [
                            'nama'             => $d['nama'],
                            'phone'            => $d['phone'] ?? null,
                            'no_rekening'      => $d['no_rekening'] ?? null,
                            'nama_bank'        => $d['nama_bank'] ?? null,
                            'birth_date'       => $d['tanggal_lahir'] ?? null,
                            'gender'           => $d['jenis_kelamin'] ?? null,
                            'fakultas_id'      => $fakultasId,
                            'master_id'        => (string) $d['id'],
                            'master_synced_at' => now(),
                        ]
                    );
                    $synced++;
                } catch (\Exception $e) {
                    $errors++;
                    $this->command->warn("  Error NIP {$d['nip']}: {$e->getMessage()}");
                }
            }

            $this->command->info("  Page {$page}/{$lastPage} — synced: {$synced}, skipped: {$skipped}, errors: {$errors}");
            $page++;
        } while ($page <= $lastPage);

        $this->command->info("Dosen sync complete: {$synced} synced, {$skipped} skipped (no faculty), {$errors} errors.");
    }
}
