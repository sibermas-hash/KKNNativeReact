<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

/**
 * One-time proactive encryption for mahasiswa PII.
 *
 * Setelah cast `encrypted` diaktifkan pada `nik`, `mother_name`, `alamat`
 * (migration 2026_05_10_033000), row LAMA masih menyimpan plaintext
 * sampai ada write berikutnya — yang mungkin tidak terjadi untuk
 * mahasiswa yang sudah lulus KKN.
 *
 * Command ini bekerja LANGSUNG di level DB (tanpa model Eloquent),
 * karena cast `encrypted` akan meledak dengan DecryptException kalau
 * kita akses plaintext via model. Untuk tiap kolom PII kita:
 *
 *   1. Ambil raw value via DB::table()->value() — melewati cast.
 *   2. Skip kalau kosong atau sudah terenkripsi (header base64 JSON `eyJ`).
 *   3. Encrypt via Crypt::encryptString() — persis pipeline yang dipakai
 *      cast `encrypted` sehingga decrypt via model nanti seamless.
 *   4. Tulis kembali via DB::table()->update() — juga melewati cast.
 *
 * Usage:
 *   php artisan pii:encrypt-mahasiswa                    # dry-run
 *   php artisan pii:encrypt-mahasiswa --apply            # tulis beneran
 *   php artisan pii:encrypt-mahasiswa --apply --chunk=200 --sleep=500
 *
 * Safety:
 *   - Dry-run default.
 *   - Chunking + sleep untuk throttle DB di prod.
 *   - Idempotent: rerun aman, yang sudah encrypted dilewati.
 *   - Tidak menyentuh `updated_at` — bypass touch supaya sync timestamps
 *     tetap mencerminkan waktu modifikasi data sebenarnya.
 */
class PiiEncryptMahasiswa extends Command
{
    protected $signature = 'pii:encrypt-mahasiswa
                            {--apply : Tulis ciphertext ke DB (tanpa flag: dry-run)}
                            {--chunk=500 : Batch size per iterasi}
                            {--sleep=0 : Delay (ms) antar batch}';

    protected $description = 'Backfill encryption untuk NIK, mother_name, alamat pada row mahasiswa yang masih plaintext.';

    private const FIELDS = ['nik', 'nim', 'mother_name', 'alamat'];

    public function handle(): int
    {
        $apply = (bool) $this->option('apply');
        $chunkSize = max(50, (int) $this->option('chunk'));
        $sleepMs = max(0, (int) $this->option('sleep'));

        $this->info(sprintf(
            '%s mode — fields: %s, chunk=%d, sleep=%dms',
            $apply ? 'APPLY' : 'DRY-RUN',
            implode(', ', self::FIELDS),
            $chunkSize,
            $sleepMs,
        ));

        $stats = [
            'rows_scanned' => 0,
            'rows_all_clean' => 0,
            'rows_encrypted' => 0,
            'fields_encrypted' => 0,
            'errors' => 0,
        ];

        $totalRows = (int) DB::table('mahasiswa')->count();
        $this->info("Total mahasiswa rows: {$totalRows}");
        if ($totalRows === 0) {
            $this->warn('Tidak ada row — selesai.');

            return self::SUCCESS;
        }

        $bar = $this->output->createProgressBar($totalRows);
        $bar->start();

        DB::table('mahasiswa')
            ->select(array_merge(['id'], self::FIELDS))
            ->orderBy('id')
            ->chunkById($chunkSize, function ($chunk) use ($apply, $sleepMs, &$stats, $bar): void {
                foreach ($chunk as $row) {
                    $stats['rows_scanned']++;
                    $updates = [];

                    foreach (self::FIELDS as $field) {
                        $raw = $row->{$field} ?? null;

                        if ($raw === null) {
                            continue;
                        }

                        // Empty string must be normalized to NULL — otherwise
                        // Laravel's `encrypted` cast tries to decrypt '' on read
                        // and throws DecryptException. This was the root cause
                        // of a test failure on 2026-05-10.
                        if ($raw === '') {
                            if ($apply) {
                                DB::table('mahasiswa')->where('id', $row->id)->update([$field => null]);
                            }
                            continue;
                        }

                        if ($this->looksEncrypted((string) $raw)) {
                            continue;
                        }

                        try {
                            $updates[$field] = Crypt::encryptString((string) $raw);
                        } catch (\Throwable $e) {
                            $stats['errors']++;
                            $this->error(sprintf(
                                'Encrypt gagal row id=%d field=%s: %s',
                                $row->id,
                                $field,
                                $e->getMessage(),
                            ));
                        }
                    }

                    if ($updates === []) {
                        $stats['rows_all_clean']++;
                        $bar->advance();

                        continue;
                    }

                    if ($apply) {
                        try {
                            DB::table('mahasiswa')
                                ->where('id', $row->id)
                                ->update($updates);

                            $stats['rows_encrypted']++;
                            $stats['fields_encrypted'] += count($updates);
                        } catch (\Throwable $e) {
                            $stats['errors']++;
                            $this->error(sprintf(
                                'Update gagal row id=%d: %s',
                                $row->id,
                                $e->getMessage(),
                            ));
                        }
                    } else {
                        $stats['rows_encrypted']++;
                        $stats['fields_encrypted'] += count($updates);
                    }

                    $bar->advance();
                }

                if ($sleepMs > 0) {
                    usleep($sleepMs * 1000);
                }
            }, 'id');

        $bar->finish();
        $this->newLine(2);

        $this->table(
            ['Metric', 'Count'],
            collect($stats)->map(fn ($v, $k) => [$k, $v])->values()->toArray(),
        );

        if (! $apply) {
            $this->warn('Dry-run. Jalankan lagi dengan --apply untuk benar-benar menulis.');
        } else {
            $this->info('Backfill selesai.');
        }

        return $stats['errors'] > 0 ? self::FAILURE : self::SUCCESS;
    }

    /**
     * Laravel `encrypted` cast = `base64(JSON{iv,value,mac,tag})`. JSON
     * yang di-base64 selalu dimulai dengan "eyJ" (= `{"` di base64).
     * Heuristic cukup tajam untuk membedakan dari plaintext NIK/alamat.
     */
    private function looksEncrypted(string $value): bool
    {
        if (strlen($value) < 40) {
            return false;
        }

        return str_starts_with($value, 'eyJ');
    }
}
