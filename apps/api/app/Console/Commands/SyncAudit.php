<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SyncAudit extends Command
{
    protected $signature = 'sync:audit';

    protected $description = 'Audit sync results and FK integrity';

    public function handle(): int
    {
        $o = [];

        // Tables that use SoftDeletes have deleted_at column
        $tables = [
            'fakultas' => true,  // has SoftDeletes
            'prodi' => true,  // has SoftDeletes
            'dosen' => false, // no SoftDeletes
            'mahasiswa' => false, // no SoftDeletes
            'users' => false, // no SoftDeletes
        ];

        $counts = [];
        foreach ($tables as $table => $hasSoftDeletes) {
            $query = DB::table($table);
            if ($hasSoftDeletes && Schema::hasColumn($table, 'deleted_at')) {
                $query->whereNull('deleted_at');
            }
            $counts[$table] = $query->count();
        }

        $o[] = '=== SYNC AUDIT RESULTS ===';
        foreach ($counts as $table => $count) {
            $o[] = "  {$table}: {$count}";
        }

        $o[] = '';
        $o[] = '=== FAKULTAS DETAIL ===';
        $fakultasQuery = DB::table('fakultas')->orderBy('id');
        if (Schema::hasColumn('fakultas', 'deleted_at')) {
            $fakultasQuery->whereNull('deleted_at');
        }
        foreach ($fakultasQuery->get() as $f) {
            $o[] = "  ID={$f->id} | master={$f->master_id} | code={$f->code} | {$f->nama}";
        }

        $o[] = '';
        $o[] = '=== PRODI DETAIL ===';
        $prodiQuery = DB::table('prodi')->orderBy('id');
        if (Schema::hasColumn('prodi', 'deleted_at')) {
            $prodiQuery->whereNull('deleted_at');
        }
        foreach ($prodiQuery->get() as $p) {
            $o[] = "  ID={$p->id} | master={$p->master_id} | fak={$p->fakultas_id} | {$p->nama}";
        }

        // FK integrity: mahasiswa → fakultas (exclude NULL — legitimately unassigned)
        $orphansFak = DB::select('
            SELECT m.fakultas_id, COUNT(*) as cnt
            FROM mahasiswa m
            LEFT JOIN fakultas f ON f.id = m.fakultas_id AND f.deleted_at IS NULL
            WHERE m.fakultas_id IS NOT NULL AND f.id IS NULL
            GROUP BY m.fakultas_id
        ');

        // FK integrity: mahasiswa → prodi (exclude NULL)
        $orphansProdi = DB::select('
            SELECT m.prodi_id, COUNT(*) as cnt
            FROM mahasiswa m
            LEFT JOIN prodi p ON p.id = m.prodi_id AND p.deleted_at IS NULL
            WHERE m.prodi_id IS NOT NULL AND p.id IS NULL
            GROUP BY m.prodi_id
        ');

        // FK integrity: dosen → fakultas (exclude NULL — external lecturers)
        $orphansDosen = DB::select('
            SELECT d.fakultas_id, COUNT(*) as cnt
            FROM dosen d
            LEFT JOIN fakultas f ON f.id = d.fakultas_id AND f.deleted_at IS NULL
            WHERE d.fakultas_id IS NOT NULL AND f.id IS NULL
            GROUP BY d.fakultas_id
        ');

        $o[] = '';
        $o[] = '=== FK INTEGRITY ===';

        if (empty($orphansFak)) {
            $o[] = '  OK - mahasiswa.fakultas_id: all references valid';
        } else {
            foreach ($orphansFak as $orphan) {
                $o[] = "  FAIL - mahasiswa.fakultas_id={$orphan->fakultas_id}: {$orphan->cnt} orphans";
            }
        }

        if (empty($orphansProdi)) {
            $o[] = '  OK - mahasiswa.prodi_id: all references valid';
        } else {
            foreach ($orphansProdi as $orphan) {
                $o[] = "  FAIL - mahasiswa.prodi_id={$orphan->prodi_id}: {$orphan->cnt} orphans";
            }
        }

        if (empty($orphansDosen)) {
            $o[] = '  OK - dosen.fakultas_id: all references valid';
        } else {
            foreach ($orphansDosen as $orphan) {
                $o[] = "  FAIL - dosen.fakultas_id={$orphan->fakultas_id}: {$orphan->cnt} orphans";
            }
        }

        // Sync timestamps
        $latestMhs = DB::table('mahasiswa')->max('master_synced_at');
        $latestDosen = DB::table('dosen')->max('master_synced_at');
        $latestFak = DB::table('fakultas')->max('master_synced_at');
        $latestProdi = DB::table('prodi')->max('master_synced_at');

        $o[] = '';
        $o[] = '=== LATEST SYNC TIMESTAMPS ===';
        $o[] = '  mahasiswa: '.($latestMhs ?? 'never');
        $o[] = '  dosen:     '.($latestDosen ?? 'never');
        $o[] = '  fakultas:  '.($latestFak ?? 'never');
        $o[] = '  prodi:     '.($latestProdi ?? 'never');

        // Sync logs summary
        $syncLogs = DB::table('sync_logs')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['entity_type', 'sync_type', 'status', 'total_fetched', 'total_created', 'total_updated', 'total_errors', 'duration_seconds', 'created_at']);

        $o[] = '';
        $o[] = '=== RECENT SYNC LOGS (last 10) ===';
        foreach ($syncLogs as $log) {
            $o[] = "  [{$log->created_at}] {$log->entity_type} ({$log->sync_type}): {$log->status} | fetched={$log->total_fetched} created={$log->total_created} updated={$log->total_updated} errors={$log->total_errors} | {$log->duration_seconds}s";
        }

        $output = implode("\n", $o)."\n";

        // Write to file
        file_put_contents(base_path('storage/logs/audit_result_artisan.txt'), $output);

        // Also output to console
        $this->line($output);

        return 0;
    }
}
