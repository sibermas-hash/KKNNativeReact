<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Redis;

class HealthController extends Controller
{
    public function check(): JsonResponse
    {
        $healthy = $this->isHealthy();

        return response()->json([
            'status' => $healthy ? 'ok' : 'error',
            'timestamp' => now()->toIso8601String(),
        ], $healthy ? 200 : 503);
    }

    public function detailed(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'cache' => $this->checkCache(),
            'queue' => $this->checkQueue(),
            'storage' => $this->checkStorage(),
            'api_external' => $this->checkExternalApi(),
        ];

        $allHealthy = collect($checks)->every(fn ($check) => $check['status'] === true);

        return response()->json([
            'status' => $allHealthy ? 'healthy' : 'degraded',
            'timestamp' => now()->toIso8601String(),
            'version' => config('app.version', '4.0.0'),
            'environment' => config('app.env'),
            'debug' => config('app.debug'),
            'checks' => $checks,
        ], $allHealthy ? 200 : 503);
    }

    protected function isHealthy(): bool
    {
        try {
            DB::connection()->getPdo();
            Cache::get('health_check');

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    protected function checkDatabase(): array
    {
        try {
            $start = microtime(true);
            DB::connection()->getPdo();
            $latency = round((microtime(true) - $start) * 1000, 2);

            $tables = DB::select("
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            ");

            return [
                'status' => true,
                'latency_ms' => $latency,
                'tables' => $tables[0]->count ?? 0,
            ];
        } catch (\Exception $e) {
            return [
                'status' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    protected function checkCache(): array
    {
        try {
            $start = microtime(true);
            $key = 'health_check_'.time();
            Cache::put($key, 'ok', 60);
            $value = Cache::get($key);
            Cache::forget($key);
            $latency = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => $value === 'ok',
                'latency_ms' => $latency,
                'driver' => config('cache.default'),
            ];
        } catch (\Exception $e) {
            return [
                'status' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    protected function checkQueue(): array
    {
        try {
            $queue = config('queue.default');

            if ($queue === 'redis') {
                Redis::ping();
            }

            $pendingJobs = 0;
            try {
                $pendingJobs = DB::table('jobs')->whereNull('reserved_at')->count();
            } catch (\Exception $e) {
                // Table might not exist
            }

            return [
                'status' => true,
                'driver' => $queue,
                'pending_jobs' => $pendingJobs,
            ];
        } catch (\Exception $e) {
            return [
                'status' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    protected function checkStorage(): array
    {
        try {
            $paths = [
                storage_path('app'),
                storage_path('framework/cache'),
                storage_path('framework/sessions'),
                storage_path('framework/views'),
                storage_path('logs'),
            ];

            $allWritable = true;
            foreach ($paths as $path) {
                if (! is_dir($path)) {
                    @mkdir($path, 0755, true);
                }
                if (! is_writable($path)) {
                    $allWritable = false;
                }
            }

            return [
                'status' => $allWritable,
                'writable_paths' => $allWritable ? count($paths) : 0,
            ];
        } catch (\Exception $e) {
            return [
                'status' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    protected function checkExternalApi(): array
    {
        try {
            if (! config('services.master_api.url')) {
                return [
                    'status' => true,
                    'message' => 'Not configured',
                ];
            }

            $start = microtime(true);
            $response = Http::timeout(5)
                ->get(config('services.master_api.url').'/health');
            $latency = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => $response->successful(),
                'latency_ms' => $latency,
                'url' => config('services.master_api.url'),
            ];
        } catch (\Exception $e) {
            return [
                'status' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
