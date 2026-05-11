<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

/**
 * Superadmin-triggered SIAKAD sync with a PostgreSQL backup step in front.
 *
 * Goals:
 *   1. The scheduled `master:webhook:sync` is intentionally disabled — SIAKAD
 *      sync is now an operator-driven action, not automatic. This controller
 *      is the HTTP surface for that manual action.
 *   2. Every manual sync is preceded by a fresh database backup (pg_dump via
 *      the `db:backup` command) so the admin always has a rollback path if
 *      the sync pulls in garbage from SIAKAD.
 *
 * Runs synchronously inside the request lifecycle. The underlying sync
 * command is capped by the `type=` parameter (default: `all`) but the
 * superadmin can scope it to a single entity to keep the request fast.
 * For very large datasets, call the queued endpoints instead
 * (e.g. /admin/database-sync/manual).
 */
class SiakadSyncAdminController extends Controller
{
    use ApiResponse;

    /**
     * POST /admin/sync/backup
     *
     * Runs the pg_dump based backup command only. Returns the backup filename
     * on success.
     */
    public function backup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'keep_days' => ['nullable', 'integer', 'min:1', 'max:365'],
        ]);

        $keepDays = (int) ($validated['keep_days'] ?? 7);

        $exit = Artisan::call('db:backup', [
            '--keep' => $keepDays,
        ]);

        $output = Artisan::output();

        Log::info('Manual DB backup triggered', [
            'admin_user_id' => $request->user()?->id,
            'exit' => $exit,
            'keep_days' => $keepDays,
        ]);

        if ($exit !== 0) {
            return $this->error(
                'BACKUP_FAILED',
                'Backup database gagal. Periksa log aplikasi.',
                500,
                ['artisan_output' => $output]
            );
        }

        return $this->success([
            'artisan_output' => $output,
            'keep_days' => $keepDays,
        ], 'Backup database berhasil dibuat.');
    }

    /**
     * POST /admin/sync/run-with-backup
     *
     * 1. Run db:backup (pg_dump).
     * 2. Only if backup succeeds, run sync:master-data.
     *
     * Body:
     *   type:      all | mahasiswa | dosen | fakultas | program (default: all)
     *   delta:     bool — if true, use --delta (since last sync)
     *   source:    api | db (default: api)
     *   keep_days: backup retention override
     */
    public function runWithBackup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['nullable', 'in:all,mahasiswa,dosen,fakultas,faculty,program,prodi'],
            'delta' => ['nullable', 'boolean'],
            'source' => ['nullable', 'in:api,db'],
            'keep_days' => ['nullable', 'integer', 'min:1', 'max:365'],
        ]);

        $type = $validated['type'] ?? 'all';
        $delta = (bool) ($validated['delta'] ?? false);
        $source = $validated['source'] ?? 'api';
        $keepDays = (int) ($validated['keep_days'] ?? 7);

        // 1) Backup first. If this fails, we refuse to sync — a corrupt sync
        //    without a safety net is exactly the failure mode this endpoint
        //    was built to prevent.
        $backupExit = Artisan::call('db:backup', [
            '--keep' => $keepDays,
        ]);
        $backupOutput = Artisan::output();

        Log::info('Pre-sync DB backup executed', [
            'admin_user_id' => $request->user()?->id,
            'exit' => $backupExit,
            'type' => $type,
        ]);

        if ($backupExit !== 0) {
            return $this->error(
                'BACKUP_FAILED',
                'Backup database gagal. Sinkronisasi dibatalkan. Periksa log aplikasi.',
                500,
                ['backup_output' => $backupOutput]
            );
        }

        // 2) Run sync. Exit code is propagated so frontend can show full/partial.
        $syncArgs = [
            '--type' => $type,
            '--source' => $source,
            '--force' => true,
        ];
        if ($delta) {
            $syncArgs['--delta'] = true;
        }

        $syncExit = Artisan::call('sync:master-data', $syncArgs);
        $syncOutput = Artisan::output();

        Log::info('Manual sync:master-data executed', [
            'admin_user_id' => $request->user()?->id,
            'exit' => $syncExit,
            'type' => $type,
            'delta' => $delta,
            'source' => $source,
        ]);

        $payload = [
            'backup' => [
                'exit_code' => $backupExit,
                'output' => $backupOutput,
            ],
            'sync' => [
                'exit_code' => $syncExit,
                'output' => $syncOutput,
                'type' => $type,
                'delta' => $delta,
                'source' => $source,
            ],
        ];

        if ($syncExit !== 0) {
            return $this->error(
                'SYNC_FAILED',
                'Backup berhasil, tetapi sinkronisasi SIAKAD gagal. Tidak ada data yang hilang — periksa log.',
                500,
                $payload
            );
        }

        return $this->success($payload, 'Backup + sinkronisasi SIAKAD berhasil.');
    }
}
