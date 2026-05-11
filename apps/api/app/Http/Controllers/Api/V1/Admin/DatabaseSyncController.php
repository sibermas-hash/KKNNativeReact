<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DatabaseSyncLogResource;
use App\Http\Traits\ApiResponse;
use App\Jobs\SyncAllDosenJob;
use App\Jobs\SyncAllMahasiswaJob;
use App\Jobs\SyncDosenJob;
use App\Jobs\SyncFacultyJob;
use App\Jobs\SyncMahasiswaJob;
use App\Jobs\SyncProgramJob;
use App\Models\KKN\DatabaseSyncLog;
use App\Services\DatabaseSyncMonitoringService;
use App\Services\MasterApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DatabaseSyncController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly DatabaseSyncMonitoringService $monitoringService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $logs = DatabaseSyncLog::latest()
            ->when($request->input('entity_type'), fn ($q, $t) => $q->where('entity_type', $t))
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->paginate($request->input('per_page', 25));

        return $this->successCollection(DatabaseSyncLogResource::collection($logs));
    }

    public function show(DatabaseSyncLog $log): JsonResponse
    {
        return $this->success($log);
    }

    public function health(): JsonResponse
    {
        return $this->success($this->monitoringService->checkDatabaseHealth());
    }

    public function statistics(): JsonResponse
    {
        return $this->success($this->monitoringService->getLastSyncStatistics());
    }

    public function retry(Request $request): JsonResponse
    {
        $type = $request->validate(['type' => ['required', 'in:mahasiswa,dosen,faculty,program']])['type'];

        match ($type) {
            'mahasiswa' => SyncAllMahasiswaJob::dispatch(),
            'dosen' => SyncAllDosenJob::dispatch(),
            'faculty' => SyncFacultyJob::dispatch(),
            'program' => SyncProgramJob::dispatch(),
        };

        return $this->success(null, "Sinkronisasi {$type} dijadwalkan ulang.");
    }

    public function retryLog(DatabaseSyncLog $log): JsonResponse
    {
        $this->monitoringService->retryFailedSyncs($log->entity_type, 1);

        return $this->success(null, 'Log sinkronisasi dijadwalkan ulang.');
    }

    public function cleanup(Request $request): JsonResponse
    {
        $days = $request->input('older_than_days', 30);
        $deleted = DatabaseSyncLog::where('created_at', '<', now()->subDays($days))->delete();

        return $this->success(['deleted_count' => $deleted], "{$deleted} log lama berhasil dihapus.");
    }

    public function testConnection(): JsonResponse
    {
        $results = [];

        // Test local database connection
        try {
            $dbResult = DB::connection()->select('SELECT 1 as test');
            $database = DB::connection()->getDatabaseName();
            $host = DB::connection()->getConfig('host');
            $results['database'] = [
                'status' => 'success',
                'message' => 'Koneksi database berhasil',
                'database' => $database,
                'host' => $host,
            ];
        } catch (\Exception $e) {
            $results['database'] = [
                'status' => 'error',
                'message' => 'Koneksi database gagal',
                'error' => $e->getMessage(),
            ];
        }

        // Test Master API connection
        try {
            $apiResult = app(MasterApiService::class)->healthCheck();
            $results['master_api'] = $apiResult;
        } catch (\Exception $e) {
            $results['master_api'] = [
                'status' => 'error',
                'message' => 'Koneksi Master API gagal',
                'error' => $e->getMessage(),
            ];
        }

        $overallStatus = collect($results)->every(fn ($r) => ($r['status'] ?? '') === 'success') ? 'success' : 'error';

        return $this->success([
            'status' => $overallStatus,
            'results' => $results,
        ], 'Tes koneksi selesai.');
    }

    private function normalizeEntityType(string $entityType): string
    {
        return match (strtolower(trim($entityType))) {
            'faculty', 'fakultas' => 'fakultas',
            'program', 'prodi' => 'program',
            default => strtolower(trim($entityType)),
        };
    }

    public function manualSync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:mahasiswa,dosen,faculty,fakultas,program,prodi,all'],
            'entity_id' => ['nullable', 'string'],
            'sync_mode' => ['sometimes', 'in:full,incremental'],
        ]);

        $type = $this->normalizeEntityType($validated['type']);
        $entityId = $validated['entity_id'] ?? null;
        $syncMode = $validated['sync_mode'] ?? 'full';

        if ($type === 'all') {
            SyncAllMahasiswaJob::dispatch();
            SyncAllDosenJob::dispatch();
            SyncFacultyJob::dispatch();
            SyncProgramJob::dispatch();
        } else {
            if ($type === 'mahasiswa') {
                $syncMode === 'full' ? SyncAllMahasiswaJob::dispatch() : SyncMahasiswaJob::dispatch($entityId);
            } elseif ($type === 'dosen') {
                $syncMode === 'full' ? SyncAllDosenJob::dispatch() : SyncDosenJob::dispatch($entityId);
            } elseif ($type === 'fakultas') {
                SyncFacultyJob::dispatch();
            } elseif ($type === 'program') {
                SyncProgramJob::dispatch();
            }
        }

        return $this->success(null, "Sinkronisasi manual {$type} berhasil dijadwalkan.");
    }
}
