<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\KKN\LogAudit;
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

        $count = LogAudit::where('created_at', '<', $date)->delete();

        $this->info("Berhasil di-prune: {$count} record.");
    }
}
