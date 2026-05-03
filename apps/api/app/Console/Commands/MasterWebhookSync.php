<?php

declare(strict_types=1);

namespace App\Console\Commands;

use const DIRECTORY_SEPARATOR;
use const LOCK_EX;
use const LOCK_NB;
use const LOCK_UN;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Throwable;

class MasterWebhookSync extends Command
{
    protected $description = 'Handle Master webhook trigger file and run sync:master-data as needed';

    protected $signature = 'master:webhook:sync';

    public function handle(): int
    {
        $dir = storage_path('app/master-webhook');
        $triggerPath = $dir.DIRECTORY_SEPARATOR.'trigger.json';
        $lockPath = $dir.DIRECTORY_SEPARATOR.'sync.lock';

        if (! is_file($triggerPath)) {
            return 0;
        }

        if (! is_dir($dir)) {
            if (! mkdir($dir, 0775, true)) {
                $this->warn('Cannot create directory for Master webhook sync');

                return 0;
            }
        }

        $fp = fopen($lockPath, 'c');
        if (! \is_resource($fp)) {
            $this->warn('Cannot open lock file for Master webhook sync');

            return 0;
        }

        try {
            if (! flock($fp, LOCK_EX | LOCK_NB)) {
                // Another sync is running.
                return 0;
            }

            $raw = file_get_contents($triggerPath);
            if ($raw === false) {
                $this->warn('Cannot read trigger file');

                return 0;
            }

            $payload = json_decode($raw, true);
            $resources = (\is_array($payload) && isset($payload['resources']) && \is_array($payload['resources']))
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

            if (! unlink($triggerPath)) {
                Log::warning('Failed to delete trigger file', ['path' => $triggerPath]);
            }

            Log::info('Master webhook sync completed (KKN)', [
                'type' => $type,
                'resources' => $resources,
            ]);

            $this->info('Master webhook sync completed.');

            return 0;
        } catch (Throwable $e) {
            Log::error('Master webhook sync exception (KKN)', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return 1;
        } finally {
            flock($fp, LOCK_UN);
            fclose($fp);
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

        if (\count($types) === 1) {
            return array_key_first($types);
        }

        return 'all';
    }
}
