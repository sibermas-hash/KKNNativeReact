<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\RedisCacheService;
use Illuminate\Console\Command;

class RedisCacheWarmup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cache:warmup {--fresh : Clear all caches before warmup}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Warm up Redis cache with critical master data for optimal performance';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔥 Starting Redis cache warmup...');

        if ($this->option('fresh')) {
            $this->warn('Clearing all caches...');
            RedisCacheService::invalidateAll();
            $this->info('✓ Caches cleared');
        }

        // Check Redis health
        if (! RedisCacheService::isHealthy()) {
            $this->error('❌ Redis is not healthy. Check connection.');

            return 1;
        }
        $this->info('✓ Redis connection healthy');

        // Warm up caches
        $this->info('Loading master data into cache...');
        $result = RedisCacheService::warmUp();

        if ($result['success']) {
            foreach ($result['warmed'] as $item) {
                $this->line("  ✓ Warmed: {$item}");
            }
        } else {
            $this->error("❌ Warmup failed: {$result['error']}");

            return 1;
        }

        // Show stats
        $stats = RedisCacheService::getStats();
        $this->newLine();
        $this->info('📊 Redis Statistics:');
        $this->line("  Status: {$stats['status']}");
        $this->line("  Memory Used: {$stats['memory_used']}");
        $this->line("  Memory Peak: {$stats['memory_peak']}");
        $this->line("  Connected Clients: {$stats['connected_clients']}");

        $this->newLine();
        $this->info('✅ Cache warmup completed successfully!');

        return 0;
    }
}
