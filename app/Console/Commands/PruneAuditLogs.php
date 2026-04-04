<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class PruneAuditLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'audit:prune {months=6 : Jumlah bulan untuk menyimpan log}';

    protected $description = 'Hapus log audit lama untuk menjaga performa database';

    public function handle()
    {
        $months = (int) $this->argument('months');
        $date = now()->subMonths($months);

        $this->info("Menghapus log audit yang lebih lama dari {$date->toDateTimeString()}...");

        $count = \App\Models\KKN\LogAudit::where('created_at', '<', $date)->delete();

        $this->info("Berhasil di-prune: {$count} record.");
    }
}
