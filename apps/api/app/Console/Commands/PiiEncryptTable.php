<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

/**
 * Generic PII encryption backfill for any table with any set of PII columns.
 *
 * Complementary to the table-specific pii:encrypt-mahasiswa command; use this
 * one-off for Dosen, Users, ProfilUser, etc. so we don't accumulate a command
 * per table.
 *
 * Example:
 *   php artisan pii:encrypt dosen nip,nik,alamat,phone,no_rekening,npwp
 *   php artisan pii:encrypt users phone,address --apply --chunk=200
 *
 * Works at the raw DB level to avoid triggering Eloquent casts on row that
 * still hold plaintext (which would crash DecryptException). Uses the
 * `Crypt::encryptString` pipeline (same as `encrypted` cast) so values
 * decrypt seamlessly once the cast is enabled on the model.
 */
class PiiEncryptTable extends Command
{
    protected $signature = 'pii:encrypt
                            {table : Nama tabel}
                            {fields : Daftar kolom PII (koma-separated)}
                            {--apply : Tulis ciphertext ke DB (default: dry-run)}
                            {--chunk=500 : Batch size per iterasi}
                            {--sleep=0 : Delay (ms) antar batch}';

    protected $description = 'Generic backfill: encrypt existing plaintext PII columns in any table via Crypt::encryptString.';

    public function handle(): int
    {
        $table = (string) $this->argument('table');
        $fields = array_values(array_filter(
            array_map('trim', explode(',', (string) $this->argument('fields')))
        ));
        $apply = (bool) $this->option('apply');
        $chunkSize = max(50, (int) $this->option('chunk'));
        $sleepMs = max(0, (int) $this->option('sleep'));

        if ($fields === []) {
            $this->error('Fields tidak boleh kosong. Contoh: nip,nik,alamat');

            return self::FAILURE;
        }

        // Verify table + columns exist.
        if (! DB::getSchemaBuilder()->hasTable($table)) {
            $this->error("Tabel {$table} tidak ada.");

            return self::FAILURE;
        }

        $missing = array_filter($fields, fn ($f) => ! DB::getSchemaBuilder()->hasColumn($table, $f));
        if ($missing !== []) {
            $this->error('Kolom tidak ada: '.implode(', ', $missing));

            return self::FAILURE;
        }

        $this->info(sprintf(
            '%s mode — table=%s, fields=[%s], chunk=%d, sleep=%dms',
            $apply ? 'APPLY' : 'DRY-RUN',
            $table,
            implode(', ', $fields),
            $chunkSize,
            $sleepMs,
        ));

        $total = (int) DB::table($table)->count();
        if ($total === 0) {
            $this->warn('Tidak ada row — selesai.');

            return self::SUCCESS;
        }
        $this->info("Total rows: {$total}");

        $stats = [
            'rows_scanned' => 0,
            'rows_all_clean' => 0,
            'rows_encrypted' => 0,
            'fields_encrypted' => 0,
            'errors' => 0,
        ];

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        DB::table($table)
            ->select(array_merge(['id'], $fields))
            ->orderBy('id')
            ->chunkById($chunkSize, function ($chunk) use ($apply, $fields, $table, $sleepMs, &$stats, $bar): void {
                foreach ($chunk as $row) {
                    $stats['rows_scanned']++;
                    $updates = [];

                    foreach ($fields as $field) {
                        $raw = $row->{$field} ?? null;

                        if ($raw === null) {
                            continue;
                        }

                        // Normalize empty string to NULL before encryption.
                        // Laravel `encrypted` cast does NOT handle '' on read
                        // and throws DecryptException. See pii:encrypt-mahasiswa
                        // for the same guard.
                        if ($raw === '') {
                            if ($apply) {
                                DB::table($table)->where('id', $row->id)->update([$field => null]);
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
                                'Encrypt gagal %s id=%d field=%s: %s',
                                $table, $row->id, $field, $e->getMessage(),
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
                            DB::table($table)->where('id', $row->id)->update($updates);
                            $stats['rows_encrypted']++;
                            $stats['fields_encrypted'] += count($updates);
                        } catch (\Throwable $e) {
                            $stats['errors']++;
                            $this->error(sprintf(
                                'Update gagal %s id=%d: %s',
                                $table, $row->id, $e->getMessage(),
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

    private function looksEncrypted(string $value): bool
    {
        return strlen($value) >= 40 && str_starts_with($value, 'eyJ');
    }
}
