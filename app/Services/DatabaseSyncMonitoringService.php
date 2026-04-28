<?php

declare(strict_types=1);

namespace App\Services;

use App\Jobs\SyncDosenJob;
use App\Jobs\SyncFacultyJob;
use App\Jobs\SyncMahasiswaJob;
use App\Jobs\SyncProgramJob;
use App\Models\KKN\DatabaseSyncLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DatabaseSyncMonitoringService
{
    /**
     * Check health of all database connections
     */
    public function checkDatabaseHealth(): array
    {
        $results = [];

        // Check PostgreSQL Database (single connection)
        $results['pgsql'] = $this->checkConnection('pgsql');

        // Check Redis
        $results['redis'] = $this->checkRedis();

        // Overall status
        $results['overall_status'] = $this->determineOverallStatus($results);
        $results['timestamp'] = now()->toIso8601String();

        return $results;
    }

    /**
     * Check individual database connection
     */
    protected function checkConnection(string $connection): array
    {
        try {
            $start = microtime(true);
            $result = DB::connection($connection)->select('SELECT 1 as test');
            $latency = round((microtime(true) - $start) * 1000, 2);

            // Get connection info
            $database = DB::connection($connection)->getDatabaseName();
            $host = DB::connection($connection)->getConfig('host');
            $port = DB::connection($connection)->getConfig('port');

            // Get table count
            $tableCount = DB::connection($connection)
                ->table('information_schema.tables')
                ->where('table_schema', $database)
                ->count();

            return [
                'status' => 'connected',
                'database' => $database,
                'host' => $host,
                'port' => $port,
                'latency_ms' => $latency,
                'table_count' => $tableCount,
                'error' => null,
            ];
        } catch (\Exception $e) {
            Log::error("Database health check failed for {$connection}", [
                'error' => $e->getMessage(),
            ]);

            return [
                'status' => 'disconnected',
                'database' => null,
                'host' => null,
                'port' => null,
                'latency_ms' => null,
                'table_count' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check Redis connection
     */
    protected function checkRedis(): array
    {
        try {
            $start = microtime(true);
            $redis = app('redis');
            $redis->ping();
            $latency = round((microtime(true) - $start) * 1000, 2);

            // Get Redis info
            $info = $redis->info();
            $usedMemory = $info['used_memory_human'] ?? 'N/A';
            $connectedClients = $info['connected_clients'] ?? 'N/A';

            return [
                'status' => 'connected',
                'latency_ms' => $latency,
                'used_memory' => $usedMemory,
                'connected_clients' => $connectedClients,
                'error' => null,
            ];
        } catch (\Exception $e) {
            // Log as warning to prevent log pollution if Redis is optional/local
            if (! app()->isLocal()) {
                Log::warning('Redis connection monitoring failed: '.$e->getMessage());
            }

            return [
                'status' => 'disconnected',
                'latency_ms' => null,
                'used_memory' => null,
                'connected_clients' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check Master API health
     */
    public function checkMasterApiHealth(): array
    {
        $service = app(MasterApiService::class);
        $apiHealth = $service->healthCheck();

        // Get last sync statistics
        $lastSyncStats = $this->getLastSyncStatistics();

        return [
            'api_status' => $apiHealth['status'] ?? 'DOWN',
            'api_error' => $apiHealth['error'] ?? null,
            'last_sync' => $lastSyncStats,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * Get last sync statistics
     */
    public function getLastSyncStatistics(): array
    {
        $mahasiswaStats = DatabaseSyncLog::getStatistics('mahasiswa', '7'); // Last 7 days
        $dosenStats = DatabaseSyncLog::getStatistics('dosen', '7');

        return [
            'mahasiswa' => [
                'total_syncs' => $mahasiswaStats['total'],
                'successful' => $mahasiswaStats['successful'],
                'failed' => $mahasiswaStats['failed'],
                'success_rate' => $mahasiswaStats['success_rate'],
                'recent_failures' => $mahasiswaStats['recent_failures']->take(5)->toArray(),
            ],
            'dosen' => [
                'total_syncs' => $dosenStats['total'],
                'successful' => $dosenStats['successful'],
                'failed' => $dosenStats['failed'],
                'success_rate' => $dosenStats['success_rate'],
                'recent_failures' => $dosenStats['recent_failures']->take(5)->toArray(),
            ],
        ];
    }

    /**
     * Determine overall system status
     */
    protected function determineOverallStatus(array $results): string
    {
        $critical = ['pgsql', 'redis'];

        foreach ($critical as $service) {
            if (! isset($results[$service]['status']) || $results[$service]['status'] !== 'connected') {
                return 'critical';
            }
        }

        // Check if there are recent sync failures
        $recentFailures = DatabaseSyncLog::where('status', 'failed')
            ->where('created_at', '>', now()->subHour())
            ->count();

        if ($recentFailures > 10) {
            return 'warning';
        }

        return 'healthy';
    }

    /**
     * Get sync health dashboard data
     */
    public function getSyncDashboard(): array
    {
        $today = now()->startOfDay();
        $yesterday = now()->subDay()->startOfDay();

        // Today's sync stats
        $todayStats = DatabaseSyncLog::query()
            ->whereDate('created_at', '>=', $today)
            ->selectRaw('entity_type, status, COUNT(*) as count')
            ->groupBy('entity_type', 'status')
            ->get()
            ->groupBy('entity_type');

        // Sync trends (last 7 days)
        $trends = DatabaseSyncLog::query()
            ->whereDate('created_at', '>=', $today)
            ->selectRaw('DATE(created_at) as date, status, COUNT(*) as count')
            ->groupBy('date', 'status')
            ->orderBy('date')
            ->get();

        // Error breakdown
        $errors = DatabaseSyncLog::query()
            ->where('status', 'failed')
            ->whereDate('created_at', '>=', $today)
            ->selectRaw('error_message, COUNT(*) as count')
            ->groupBy('error_message')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        return [
            'today_stats' => $todayStats,
            'trends' => $trends,
            'errors' => $errors,
            'summary' => [
                'total_today' => DatabaseSyncLog::whereDate('created_at', '>=', $today)->count(),
                'failed_today' => DatabaseSyncLog::where('status', 'failed')
                    ->whereDate('created_at', '>=', $today)
                    ->count(),
                'success_rate_today' => $this->calculateTodaySuccessRate($today),
            ],
        ];
    }

    /**
     * Calculate today's success rate
     */
    protected function calculateTodaySuccessRate(Carbon $date): float
    {
        $total = DatabaseSyncLog::whereDate('created_at', '>=', $date)->count();

        if ($total === 0) {
            return 100.0;
        }

        $successful = DatabaseSyncLog::where('status', 'success')
            ->whereDate('created_at', '>=', $date)
            ->count();

        return round(($successful / $total) * 100, 2);
    }

    /**
     * Retry failed syncs
     */
    public function retryFailedSyncs(string $entityType, int $limit = 10): int
    {
        $failedSyncs = DatabaseSyncLog::query()
            ->where('entity_type', $entityType)
            ->where('status', 'failed')
            ->orderBy('created_at')
            ->limit($limit)
            ->get();

        $retried = 0;

        foreach ($failedSyncs as $failedSync) {
            try {
                // Dispatch retry job or process immediately
                $this->processRetry($failedSync);
                $retried++;
            } catch (\Exception $e) {
                Log::error("Failed to retry sync {$failedSync->id}", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $retried;
    }

    /**
     * Process retry for a failed sync
     */
    public function processRetry(DatabaseSyncLog $failedSync): void
    {
        // This should dispatch a job or call the appropriate sync service
        // For now, log the retry attempt
        Log::info("Retrying sync {$failedSync->id} for {$failedSync->entity_type}");

        // Update status to pending
        $failedSync->update(['status' => 'pending']);

        // Dispatch job based on entity type
        match ($failedSync->entity_type) {
            'mahasiswa' => SyncMahasiswaJob::dispatch($failedSync->entity_id),
            'dosen' => SyncDosenJob::dispatch($failedSync->entity_id),
            'faculty', 'fakultas' => SyncFacultyJob::dispatch(),
            'program', 'prodi' => SyncProgramJob::dispatch(),
            default => throw new \InvalidArgumentException("Unknown entity type: {$failedSync->entity_type}"),
        };
    }

    /**
     * Cleanup old sync logs
     */
    public function cleanupOldLogs(int $retainDays = 30): int
    {
        return DatabaseSyncLog::where('created_at', '<', now()->subDays($retainDays))
            ->delete();
    }

    /**
     * Get entities that need sync
     */
    public function getPendingSyncs(string $entityType, int $limit = 100): array
    {
        // This would query a sync queue or check for entities that haven't been synced
        // Implementation depends on the specific sync strategy
        return [];
    }

    /**
     * Log manual sync operation
     */
    public function logManualSync(
        string $entityType,
        ?string $entityId,
        string $action,
        string $status,
        ?string $errorMessage = null
    ): DatabaseSyncLog {
        return DatabaseSyncLog::create([
            'source' => 'manual',
            'target' => 'kkn_db',
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'action' => $action,
            'status' => $status,
            'request_data' => [],
            'response_data' => [],
            'error_message' => $errorMessage,
            'synced_at' => $status === 'success' ? now() : null,
            'synced_by' => auth()->id(),
        ]);
    }
}
