<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

/**
 * Reverse counterpart to pii:encrypt. Decrypts ciphertext columns back to
 * plaintext. Used when we discover a field was incorrectly encrypted
 * (e.g. the NIM/NIP case: those fields are used as updateOrCreate keys and
 * non-deterministic AES ciphertext would produce duplicate rows on sync).
 *
 * Also works as part of rollback playbook when removing an `encrypted` cast
 * from a model — first decrypt the data, THEN remove the cast.
 *
 * Usage:
 *   php artisan pii:decrypt mahasiswa nim                # dry-run
 *   php artisan pii:decrypt mahasiswa nim --apply        # actually write
 *   php artisan pii:decrypt dosen nip --apply --chunk=200
 *
 * Idempotent: rows that already look plaintext (no base64 JSON envelope) are
 * skipped.
 */
class PiiDecryptTable extends Command
{
    protected $signature = 'pii:decrypt
                            {table : Nama tabel}
                            {fields : Daftar kolom (koma-separated) yang ingin di-decrypt}
                            {--apply : Tulis plaintext ke DB (tanpa flag: dry-run)}
                            {--allow-production : Wajib untuk --apply di environment production}
                            {--chunk=500 : Batch size per iterasi}
                            {--sleep=0 : Delay (ms) antar batch}';

    protected $description = 'Decrypt kolom ciphertext kembali ke plaintext. Untuk rollback pii:encrypt atau revert keputusan encrypt.';

    public function handle(): int
    {
        $table = (string) $this->argument('table');
        $fields = array_values(array_filter(
            array_map('trim', explode(',', (string) $this->argument('fields')))
        ));
        $apply = (bool) $this->option('apply');
        $chunkSize = max(50, (int) $this->option('chunk'));
        $sleepMs = max(0, (int) $this->option('sleep'));

        // R13-API-007: production guard. Decrypting PII back to plaintext is
        // destructive — it turns encrypted-at-rest data into plaintext and
        // may strip the very protection an earlier migration added. Require
        // an explicit opt-in flag + interactive confirmation in production.
        if ($apply && app()->environment('production')) {
            if (! $this->option('allow-production')) {
                $this->error('Refusing to run pii:decrypt --apply di production tanpa --allow-production.');
                return self::FAILURE;
            }
            $confirmed = $this->confirm(
                "ANDA akan DECRYPT kolom [".implode(', ', $fields)."] di tabel `{$table}` ke plaintext. Ini tidak bisa dibatalkan. Lanjutkan?",
                false,
            );
            if (! $confirmed) {
                $this->warn('Dibatalkan operator.');
                return self::FAILURE;
            }
        }

        if ($fields === []) {
            $this->error('Fields tidak boleh kosong.');

            return self::FAILURE;
        }

        if (! DB::getSchemaBuilder()->hasTable($table)) {
            $this->error("Tabel {$table} tidak ada.");

            return self::FAILURE;
        }

        foreach ($fields as $f) {
            if (! DB::getSchemaBuilder()->hasColumn($table, $f)) {
                $this->error("Kolom {$table}.{$f} tidak ada.");

                return self::FAILURE;
            }
        }

        $this->info(sprintf(
            '%s mode — table=%s, fields=[%s], chunk=%d, sleep=%dms',
            $apply ? 'APPLY' : 'DRY-RUN',
            $table,
            implode(', ', $fields),
            $chunkSize,
            $sleepMs,
        ));

        $this->warn('PENTING: jalankan command ini SEBELUM menghapus cast `encrypted` dari model. Urutan terbalik akan menyebabkan DecryptException.');

        $total = (int) DB::table($table)->count();
        if ($total === 0) {
            $this->warn('Tabel kosong.');

            return self::SUCCESS;
        }

        $stats = [
            'rows_scanned' => 0,
            'rows_already_plaintext' => 0,
            'rows_decrypted' => 0,
            'fields_decrypted' => 0,
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

                        if ($raw === null || $raw === '') {
                            continue;
                        }

                        if (! $this->looksEncrypted((string) $raw)) {
                            continue; // already plaintext
                        }

                        try {
                            $updates[$field] = Crypt::decryptString((string) $raw);
                        } catch (\Throwable $e) {
                            $stats['errors']++;
                            $this->error(sprintf(
                                'Decrypt gagal %s id=%d field=%s: %s',
                                $table, $row->id, $field, $e->getMessage(),
                            ));
                        }
                    }

                    if ($updates === []) {
                        $stats['rows_already_plaintext']++;
                        $bar->advance();

                        continue;
                    }

                    if ($apply) {
                        try {
                            DB::table($table)->where('id', $row->id)->update($updates);
                            $stats['rows_decrypted']++;
                            $stats['fields_decrypted'] += count($updates);
                        } catch (\Throwable $e) {
                            $stats['errors']++;
                            $this->error(sprintf('Update gagal %s id=%d: %s', $table, $row->id, $e->getMessage()));
                        }
                    } else {
                        $stats['rows_decrypted']++;
                        $stats['fields_decrypted'] += count($updates);
                    }

                    $bar->advance();
                }

                if ($sleepMs > 0) {
                    usleep($sleepMs * 1000);
                }
            }, 'id');

        $bar->finish();
        $this->newLine(2);
        $this->table(['Metric', 'Count'], collect($stats)->map(fn ($v, $k) => [$k, $v])->values()->toArray());

        if (! $apply) {
            $this->warn('Dry-run. Jalankan --apply untuk benar-benar menulis.');
        } else {
            $this->info('Decrypt selesai.');
        }

        return $stats['errors'] > 0 ? self::FAILURE : self::SUCCESS;
    }

    private function looksEncrypted(string $value): bool
    {
        return strlen($value) >= 40 && str_starts_with($value, 'eyJ');
    }
}
