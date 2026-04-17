<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SyncAllDosenJob;
use App\Jobs\SyncAllMahasiswaJob;
use App\Jobs\SyncDosenJob;
use App\Jobs\SyncFacultyJob;
use App\Jobs\SyncMahasiswaJob;
use App\Jobs\SyncProgramJob;
use App\Models\KKN\DatabaseSyncLog;
use App\Services\DatabaseSyncMonitoringService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DatabaseSyncController extends Controller implements HasMiddleware
{
    public function __construct(
        private readonly DatabaseSyncMonitoringService $monitoringService
    ) {}

    public static function middleware(): array
    {
        return [
            'auth',
            'role:superadmin|admin',
        ];
    }

    /**
     * Display sync monitoring dashboard
     */
    public function index(Request $request)
    {
        $health = $this->monitoringService->checkDatabaseHealth();

        try {
            $apiHealth = $this->monitoringService->checkMasterApiHealth();
        } catch (\Exception $e) {
            Log::warning('Failed to fetch Master API health: '.$e->getMessage());
            $apiHealth = [
                'api_status' => 'DOWN',
                'api_error' => $e->getMessage(),
                'last_sync' => null,
                'timestamp' => now()->toIso8601String(),
            ];
        }

        $dashboard = $this->monitoringService->getSyncDashboard();

        // Entity type filter
        $entityType = $request->get('entity_type', 'all');
        $period = $request->get('period', '7'); // days

        // Get detailed logs with pagination
        $logsQuery = DatabaseSyncLog::query()
            ->with('syncedBy:id,name')
            ->orderByDesc('created_at');

        if ($entityType !== 'all') {
            $logsQuery->where('entity_type', $entityType);
        }

        if ($period) {
            $logsQuery->where('created_at', '>=', now()->subDays((int) $period));
        }

        $logsPagination = $logsQuery->paginate(15)->withQueryString();

        // Get entity types for filter
        $entityTypes = DatabaseSyncLog::query()
            ->selectRaw('entity_type, COUNT(*) as count')
            ->groupBy('entity_type')
            ->get();

        return Inertia::render('Admin/DatabaseSync/Index', [
            'health' => $health,
            'apiHealth' => $apiHealth,
            'dashboard' => $dashboard,
            'logs' => [
                'data' => $logsPagination->items(),
                'meta' => [
                    'current_page' => $logsPagination->currentPage(),
                    'from' => $logsPagination->firstItem(),
                    'last_page' => $logsPagination->lastPage(),
                    'path' => $logsPagination->path(),
                    'per_page' => $logsPagination->perPage(),
                    'to' => $logsPagination->lastItem(),
                    'total' => $logsPagination->total(),
                    'links' => $logsPagination->linkCollection()->toArray(),
                    'prev_page_url' => $logsPagination->previousPageUrl(),
                    'next_page_url' => $logsPagination->nextPageUrl(),
                ],
            ],
            'entityTypes' => $entityTypes ?? [],
            'filters' => [
                'entity_type' => $entityType,
                'period' => $period,
            ],
        ]);
    }

    /**
     * Get real-time health status (API endpoint)
     */
    public function health()
    {
        $health = $this->monitoringService->checkDatabaseHealth();
        $apiHealth = $this->monitoringService->checkMasterApiHealth();

        return response()->json([
            'status' => $health['overall_status'],
            'databases' => [
                'kkn' => $health['kkn'],
                'master' => $health['master'],
                'redis' => $health['redis'],
            ],
            'master_api' => $apiHealth,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get sync statistics (API endpoint)
     */
    public function statistics(Request $request)
    {
        $entityType = $request->get('entity_type', 'all');
        $period = $request->get('period', '7');

        if ($entityType === 'all') {
            $stats = $this->monitoringService->getLastSyncStatistics();
        } else {
            $stats = [
                $entityType => DatabaseSyncLog::getStatistics($entityType, $period),
            ];
        }

        return response()->json($stats);
    }

    /**
     * Retry failed syncs
     */
    public function retry(Request $request)
    {
        $request->validate([
            'entity_type' => 'required|in:mahasiswa,dosen,faculty,program',
            'limit' => 'nullable|integer|min:1|max:100',
        ]);

        $entityType = $request->input('entity_type');
        $limit = $request->input('limit', 10);

        $retried = $this->monitoringService->retryFailedSyncs($entityType, $limit);

        return back()->with('success', "Berhasil retry {$retried} sync yang gagal untuk {$entityType}.");
    }

    /**
     * Retry specific sync log
     */
    public function retryLog(DatabaseSyncLog $log)
    {
        if ($log->status !== 'failed') {
            return back()->with('error', 'Sync log ini tidak dalam status failed.');
        }

        try {
            $this->monitoringService->processRetry($log);

            return back()->with('success', "Berhasil retry sync log #{$log->id}.");
        } catch (\Exception $e) {
            return back()->with('error', "Gagal retry: {$e->getMessage()}");
        }
    }

    /**
     * Cleanup old sync logs
     */
    public function cleanup(Request $request)
    {
        $request->validate([
            'retain_days' => 'required|integer|min:1|max:365',
        ]);

        $retainDays = $request->input('retain_days', 30);
        $deleted = $this->monitoringService->cleanupOldLogs($retainDays);

        return back()->with('success', "Berhasil cleanup {$deleted} sync logs lama (lebih dari {$retainDays} hari).");
    }

    /**
     * Test master database connection
     */
    public function testConnection()
    {
        try {
            // Test master database connection
            $result = DB::connection('master')->select('SELECT 1 as test');

            // Get master database info
            $database = DB::connection('master')->getDatabaseName();
            $host = DB::connection('master')->getConfig('host');

            return response()->json([
                'status' => 'success',
                'message' => 'Master database connection successful',
                'database' => $database,
                'host' => $host,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Master database connection failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Manual sync trigger
     */
    public function manualSync(Request $request)
    {
        $request->validate([
            'entity_type' => 'required|in:mahasiswa,dosen,faculty,program',
            'entity_id' => 'nullable|string',
            'sync_mode' => 'required|in:full,incremental',
        ]);

        $entityType = $request->input('entity_type');
        $entityId = $request->input('entity_id');
        $syncMode = $request->input('sync_mode');

        // Log manual sync attempt
        $log = $this->monitoringService->logManualSync(
            $entityType,
            $entityId,
            'manual_sync',
            'pending'
        );

        // Dispatch sync job
        match ($entityType) {
            'mahasiswa' => $syncMode === 'full'
                ? SyncAllMahasiswaJob::dispatch()
                : SyncMahasiswaJob::dispatch($entityId),
            'dosen' => $syncMode === 'full'
                ? SyncAllDosenJob::dispatch()
                : SyncDosenJob::dispatch($entityId),
            'faculty' => SyncFacultyJob::dispatch(),
            'program' => SyncProgramJob::dispatch(),
        };

        $log->update([
            'status' => 'pending',
            'request_data' => $request->except(['_token', 'password', 'key', 'secret']),
        ]);

        return back()->with('success', "Manual sync untuk {$entityType} sedang diproses.");
    }

    /**
     * Show specific sync log details
     */
    public function show(DatabaseSyncLog $log)
    {
        $log->load('syncedBy:id,name');

        return Inertia::render('Admin/DatabaseSync/Show', [
            'log' => $log,
        ]);
    }
}
