<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class MasterWebhookSync extends Command
{
    protected $signature = 'master:webhook:sync';

    protected $description = 'Handle Master webhook trigger file and run sync:master-data as needed';

    public function handle(): int
    {
        $dir = storage_path('app/master-webhook');
        $triggerPath = $dir . DIRECTORY_SEPARATOR . 'trigger.json';
        $lockPath = $dir . DIRECTORY_SEPARATOR . 'sync.lock';

        if (!is_file($triggerPath)) {
            return 0;
        }

        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }

        $fp = @fopen($lockPath, 'c');
        if (!is_resource($fp)) {
            $this->warn('Cannot open lock file for Master webhook sync');
            return 0;
        }

        try {
            if (!flock($fp, LOCK_EX | LOCK_NB)) {
                // Another sync is running.
                return 0;
            }

            $raw = @file_get_contents($triggerPath);
            $payload = is_string($raw) ? json_decode($raw, true) : null;
            $resources = (is_array($payload) && isset($payload['resources']) && is_array($payload['resources']))
                ? $payload['resources']
                : [];

            $type = $this->resolveSyncType($resources);

            $this->info("Master webhook trigger detected. Running sync:master-data --type={$type} ...");

            $exit = Artisan::call('sync:master-data', [
                '--type' => $type,
                '--source' => 'api',
                '--force' => true,
            ]);

            if ($exit !== 0) {
                $this->error('sync:master-data failed (will retry next schedule run)');
                Log::error('Master webhook sync failed (KKN)', [
                    'type' => $type,
                    'resources' => $resources,
                    'exit' => $exit,
                    'output' => Artisan::output(),
                ]);
                return $exit;
            }

            @unlink($triggerPath);

            Log::info('Master webhook sync completed (KKN)', [
                'type' => $type,
                'resources' => $resources,
            ]);

            $this->info('Master webhook sync completed.');
            return 0;
        } catch (\Throwable $e) {
            Log::error('Master webhook sync exception (KKN)', [
                'error' => $e->getMessage(),
            ]);
            return 1;
        } finally {
            @flock($fp, LOCK_UN);
            @fclose($fp);
        }
    }

    private function resolveSyncType(array $resources): string
    {
        $resources = array_values(array_unique(array_filter(array_map('strval', $resources))));

        // Map Master resources to KKN sync types.
        $map = [
            'organizations' => 'fakultas',
            'employees' => 'dosen',
            'students' => 'mahasiswa',
        ];

        $types = [];
        foreach ($resources as $r) {
            if (isset($map[$r])) {
                $types[$map[$r]] = true;
            }
        }

        if (count($types) === 1) {
            return array_key_first($types);
        }

        return 'all';
    }
}

