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

    public function ready(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'cache' => $this->checkCache(),
            'storage' => $this->checkStorage(),
        ];

        $allHealthy = collect($checks)->every(fn ($check) => $check['status'] === true);

        return response()->json([
            'status' => $allHealthy ? 'ready' : 'not_ready',
            'timestamp' => now()->toIso8601String(),
        ], $allHealthy ? 200 : 503);
    }

    public function detailed(): JsonResponse
    {
        $payload = $this->buildDetailedPayload(true, true);

        return response()->json($payload, $payload['status'] === 'healthy' ? 200 : 503);
    }

    public function monitoringSnapshot(): array
    {
        return $this->buildDetailedPayload(false, false);
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

    protected function buildDetailedPayload(bool $allowStateChanges, bool $includeSensitiveDetails): array
    {
        $checks = [
            'database' => $this->checkDatabase($includeSensitiveDetails),
            'cache' => $this->checkCache($allowStateChanges, $includeSensitiveDetails),
            'redis' => $this->checkRedis($includeSensitiveDetails),
            'queue' => $this->checkQueue($includeSensitiveDetails),
            'storage' => $this->checkStorage($allowStateChanges, $includeSensitiveDetails),
            'api_external' => $this->checkExternalApi($includeSensitiveDetails),
        ];

        $allHealthy = collect($checks)->every(fn ($check) => $check['status'] === true);

        $payload = [
            'status' => $allHealthy ? 'healthy' : 'degraded',
            'timestamp' => now()->toIso8601String(),
            'checks' => $checks,
        ];

        if ($includeSensitiveDetails) {
            $payload['version'] = config('app.version', '4.0.0');
            $payload['environment'] = config('app.env');
            $payload['debug'] = config('app.debug');
        }

        return $payload;
    }

    protected function checkDatabase(bool $includeSensitiveDetails = true): array
    {
        try {
            $start = microtime(true);
            DB::connection()->getPdo();
            $latency = round((microtime(true) - $start) * 1000, 2);

            $result = [
                'status' => true,
                'latency_ms' => $latency,
            ];

            if ($includeSensitiveDetails) {
                $tables = DB::select("
                    SELECT COUNT(*) as count 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                ");

                $result['tables'] = $tables[0]->count ?? 0;
            }

            return $result;
        } catch (\Exception $e) {
            return [
                'status' => false,
                'error' => $includeSensitiveDetails ? $e->getMessage() : 'Koneksi database gagal.',
            ];
        }
    }

    protected function checkCache(bool $allowStateChanges = true, bool $includeSensitiveDetails = true): array
    {
        try {
            $start = microtime(true);
            $value = null;
            if ($allowStateChanges) {
                $key = 'health_check_'.time();
                Cache::put($key, 'ok', 60);
                $value = Cache::get($key);
                Cache::forget($key);
            } else {
                $value = Cache::get('monitoring:telegram:last-heartbeat');
            }
            $latency = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => $allowStateChanges ? $value === 'ok' : true,
                'latency_ms' => $latency,
                'driver' => config('cache.default'),
            ];
        } catch (\Exception $e) {
            return [
                'status' => false,
                'error' => $includeSensitiveDetails ? $e->getMessage() : 'Akses cache gagal.',
            ];
        }
    }

    protected function checkRedis(bool $includeSensitiveDetails = true): array
    {
        try {
            $start = microtime(true);
            Redis::ping();
            $latency = round((microtime(true) - $start) * 1000, 2);

            $result = [
                'status' => true,
                'latency_ms' => $latency,
            ];

            if ($includeSensitiveDetails) {
                $info = Redis::info('server');
                $result['version'] = $info['redis_version'] ?? 'unknown';
            }

            return $result;
        } catch (\Exception $e) {
            return [
                'status' => false,
                'error' => $includeSensitiveDetails ? $e->getMessage() : 'Koneksi Redis gagal.',
            ];
        }
    }

    protected function checkQueue(bool $includeSensitiveDetails = true): array
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
                'error' => $includeSensitiveDetails ? $e->getMessage() : 'Akses job queue gagal.',
            ];
        }
    }

    protected function checkStorage(bool $allowStateChanges = true, bool $includeSensitiveDetails = true): array
    {
        try {
            $paths = [
                storage_path('app'),
                storage_path('framework/cache'),
                storage_path('framework/sessions'),
                storage_path('framework/views'),
                storage_path('logs'),
            ];

            $writablePaths = 0;
            foreach ($paths as $path) {
                if (! is_dir($path) && $allowStateChanges) {
                    @mkdir($path, 0755, true);
                }
                if (is_dir($path) && is_writable($path)) {
                    $writablePaths++;
                }
            }

            $allWritable = $writablePaths === count($paths);

            return [
                'status' => $allWritable,
                'writable_paths' => $writablePaths,
            ];
        } catch (\Exception $e) {
            return [
                'status' => false,
                'error' => $includeSensitiveDetails ? $e->getMessage() : 'Akses storage gagal.',
            ];
        }
    }

    protected function checkExternalApi(bool $includeSensitiveDetails = true): array
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

            $result = [
                'status' => $response->successful(),
                'latency_ms' => $latency,
            ];

            if ($includeSensitiveDetails) {
                $result['url'] = config('services.master_api.url');
            }

            return $result;
        } catch (\Exception $e) {
            return [
                'status' => false,
                'error' => $includeSensitiveDetails ? $e->getMessage() : 'Koneksi API eksternal gagal.',
            ];
        }
    }
}
