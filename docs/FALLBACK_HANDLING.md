# 🔌 External API Fallback & Resilience Guide

**KKN UIN SAIZU - Master API Integration**

Dokumentasi lengkap untuk fallback handling, retry logic, dan circuit breaker pattern pada integrasi Master API.

---

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Circuit Breaker Pattern](#circuit-breaker-pattern)
3. [Retry with Exponential Backoff](#retry-with-exponential-backoff)
4. [Fallback Strategies](#fallback-strategies)
5. [Configuration](#configuration)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### Masalah yang Diselesaikan

Integrasi dengan Master API (SIKAD) memiliki beberapa risiko:

1. **Network Issues** - Koneksi terputus, timeout
2. **API Downtime** - Master API sedang maintenance atau down
3. **Rate Limiting** - Terlalu banyak request dalam waktu singkat
4. **Slow Response** - Response time yang lama menghambat user experience

### Solusi Implementasi

```
┌─────────────────────────────────────────────────────────────┐
│                    Request Flow                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User Request                                                │
│       ↓                                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Circuit Breaker Check                       │   │
│  │  ┌─────────────────────────────────────────────┐     │   │
│  │  │ CLOSED: Allow request                       │     │   │
│  │  │ OPEN: Use fallback immediately              │     │   │
│  │  │ HALF-OPEN: Test request                     │     │   │
│  │  └─────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
│       ↓ (if CLOSED or HALF-OPEN)                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Retry with Backoff                          │   │
│  │  ┌─────────────────────────────────────────────┐     │   │
│  │  │ Attempt 1: Immediate                        │     │   │
│  │  │ Attempt 2: +300ms delay                     │     │   │
│  │  │ Attempt 3: +600ms delay                     │     │   │
│  │  └─────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
│       ↓ (if all attempts fail)                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Fallback Strategy                           │   │
│  │  1. Cached response (24h)                             │   │
│  │  2. Local database                                    │   │
│  │  3. Empty array (graceful degradation)                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Circuit Breaker Pattern

### Konsep

Circuit breaker mencegah aplikasi terus-menerus memanggil API yang sedang bermasalah.

### States

```
┌──────────┐     failures >= threshold    ┌──────────┐
│          │ ───────────────────────────→ │          │
│  CLOSED  │                              │   OPEN   │
│ (Normal) │ ←───── timeout elapsed ────→ │ (Fallback)│
│          │                              │          │
└──────────┘                              └────┬─────┘
     ↑                                        │
     │                                        │ test request
     │                                        ↓
     │                                 ┌──────────┐
     └──────────────────────────────── │  HALF    │
            success                    │  OPEN    │
                                       │ (Test)   │
                                       └──────────┘
```

### Configuration

```env
# Jumlah failures sebelum circuit open (default: 5)
MASTER_API_CIRCUIT_BREAKER_THRESHOLD=5

# Timeout sebelum half-open (default: 300 seconds = 5 minutes)
MASTER_API_CIRCUIT_BREAKER_TIMEOUT=300
```

### Usage

```php
$service = app(MasterApiService::class);

// Automatic circuit breaker
$data = $service->getSyncMahasiswa();

// Check status
$health = $service->healthCheck();
// Returns:
// {
//     "status": "DOWN",
//     "circuit_breaker": {
//         "status": "OPEN",
//         "failures": 5,
//         "threshold": 5,
//         "half_open_at": "2026-04-10T12:30:00Z"
//     }
// }
```

### Implementation Details

```php
// MasterApiService.php

protected function isCircuitOpen(): bool
{
    $failures = Cache::get($this->getCircuitBreakerKey(), 0);
    $lastFailure = Cache::get($this->getCircuitBreakerKey() . '_time');

    if ($failures >= $this->circuitBreakerThreshold) {
        // Check if timeout has passed (half-open state)
        if ($lastFailure && now()->timestamp - $lastFailure > $this->circuitBreakerTimeout) {
            return false; // Allow test request
        }
        return true; // Circuit is OPEN
    }

    return false; // Circuit is CLOSED
}

protected function circuitBreakerSuccess(): void
{
    Cache::put($this->getCircuitBreakerKey(), 0, $this->circuitBreakerTimeout * 2);
}

protected function circuitBreakerFailure(): void
{
    $key = $this->getCircuitBreakerKey();
    $failures = (int) Cache::get($key, 0) + 1;
    
    Cache::put($key, $failures, $this->circuitBreakerTimeout * 2);
    Cache::put($key . '_time', now()->timestamp, $this->circuitBreakerTimeout * 2);

    if ($failures >= $this->circuitBreakerThreshold) {
        Log::warning("Circuit breaker: OPEN after {$failures} failures");
    }
}
```

---

## Retry with Exponential Backoff

### Konsep

Retry dengan delay yang meningkat secara eksponensial untuk menghindari overload pada API yang sedang recovery.

### Configuration

```env
# Maximum retry attempts (default: 3)
MASTER_API_RETRY_MAX_ATTEMPTS=3

# Initial delay in milliseconds (default: 300ms)
MASTER_API_RETRY_INITIAL_DELAY=300
```

### Backoff Formula

```
Delay(n) = InitialDelay × (Multiplier ^ (n-1)) + Jitter

Where:
- n = attempt number
- Multiplier = 2.0 (exponential)
- Jitter = ±10% random variation
```

### Example Timeline

```
Attempt 1: 0ms (immediate)
Attempt 2: 300ms + jitter (±30ms)
Attempt 3: 600ms + jitter (±60ms)

Total max delay: ~900ms for 3 attempts
```

### Usage

```php
use App\Traits\RetryWithBackoff;

class MyService
{
    use RetryWithBackoff;

    public function fetchData()
    {
        return $this->retry(
            callback: fn() => Http::get('https://api.example.com/data')->json(),
            maxAttempts: 3,
            initialDelay: 300,
            backoffMultiplier: 2.0,
            exceptions: [
                ConnectionException::class,
                ServerException::class,
            ]
        );
    }
}
```

### Implementation

```php
// RetryWithBackoff.php

protected function retry(
    callable $callback,
    int $maxAttempts = 3,
    int $initialDelay = 100,
    float $backoffMultiplier = 2.0,
    array $exceptions = []
): mixed {
    $attempts = 0;
    $delay = $initialDelay;

    $defaultExceptions = [
        ConnectionException::class,
        RequestException::class,
        ServerException::class,
    ];

    $retryableExceptions = array_merge($defaultExceptions, $exceptions);

    while ($attempts < $maxAttempts) {
        try {
            $attempts++;

            if ($attempts > 1) {
                Log::info("Retry attempt {$attempts}/{$maxAttempts} after {$delay}ms");
                usleep($delay * 1000);
            }

            return $callback();

        } catch (Exception $e) {
            $shouldRetry = false;

            foreach ($retryableExceptions as $exception) {
                if ($e instanceof $exception) {
                    $shouldRetry = true;
                    break;
                }
            }

            if (!$shouldRetry || $attempts >= $maxAttempts) {
                throw $e;
            }

            // Exponential backoff
            $delay = (int) ($delay * $backoffMultiplier);

            // Add jitter (±10%)
            $jitter = (int) ($delay * 0.1 * (rand() / getrandmax() * 2 - 1));
            $delay += $jitter;
        }
    }
}
```

---

## Fallback Strategies

### Level 1: Response Cache (24 hours)

```php
// Cache successful responses
protected function cacheForFallback(string $endpoint, array $params, mixed $data): void
{
    $key = $this->getFallbackCacheKey($endpoint, $params);
    Cache::put($key, $data, now()->addHours(24));
}

// Retrieve from cache
protected function getFromFallbackCache(string $endpoint, array $params): array
{
    $key = $this->getFallbackCacheKey($endpoint, $params);
    return Cache::get($key, []);
}
```

### Level 2: Local Database

```php
protected function getFromLocalDatabase(string $entityType, array $params = []): array
{
    return match ($entityType) {
        'dosen' => Dosen::with('user', 'faculty')
            ->when(isset($params['since']), fn($q) => $q->where('updated_at', '>=', $params['since']))
            ->get()
            ->map(fn($d) => $this->formatDosenForApi($d))
            ->toArray(),
        
        'mahasiswa' => Mahasiswa::with('user', 'faculty', 'program')
            ->when(isset($params['since']), fn($q) => $q->where('updated_at', '>=', $params['since']))
            ->get()
            ->map(fn($m) => $this->formatMahasiswaForApi($m))
            ->toArray(),
        
        default => [],
    };
}
```

### Level 3: Graceful Degradation

```php
// Return empty array instead of throwing error
public function get(string $endpoint, array $params = []): array
{
    try {
        return $this->retry(fn() => $this->request($endpoint, $params));
    } catch (\Exception $e) {
        Log::error('API failed, returning empty data', ['error' => $e->getMessage()]);
        return []; // Graceful degradation
    }
}
```

### Fallback Flow

```
┌─────────────────┐
│ API Request     │
└────────┬────────┘
         │
         ↓ (fail)
┌─────────────────┐
│ Retry (3x)      │
└────────┬────────┘
         │
         ↓ (fail)
┌─────────────────┐
│ Cache (24h)     │ ← Hit: return cached data
└────────┬────────┘
         │
         ↓ (miss)
┌─────────────────┐
│ Local Database  │ ← Hit: return local data
└────────┬────────┘
         │
         ↓ (empty)
┌─────────────────┐
│ Empty Array []  │ ← Graceful degradation
└─────────────────┘
```

---

## Configuration

### Environment Variables

```env
# Master API Base Configuration
MASTER_API_URL=https://sikad.uinsaizu.ac.id/api
MASTER_API_CLIENT_ID=kkn_system
MASTER_API_CLIENT_SECRET=your-secret-here
MASTER_API_TOKEN=static-token-optional
MASTER_API_CACHE_MINUTES=60
MASTER_API_TIMEOUT=30

# Circuit Breaker
MASTER_API_CIRCUIT_BREAKER_THRESHOLD=5
MASTER_API_CIRCUIT_BREAKER_TIMEOUT=300

# Retry
MASTER_API_RETRY_MAX_ATTEMPTS=3
MASTER_API_RETRY_INITIAL_DELAY=300

# Webhook
MASTER_WEBHOOK_SECRET=your-webhook-secret
MASTER_WEBHOOK_WINDOW_SECONDS=600
```

### Config File

```php
// config/services.php

'master_api' => [
    'url' => env('MASTER_API_URL'),
    'client_id' => env('MASTER_API_CLIENT_ID'),
    'client_secret' => env('MASTER_API_CLIENT_SECRET'),
    'token' => env('MASTER_API_TOKEN'),
    'cache_minutes' => env('MASTER_API_CACHE_MINUTES', 60),
    
    // Circuit breaker
    'circuit_breaker_threshold' => env('MASTER_API_CIRCUIT_BREAKER_THRESHOLD', 5),
    'circuit_breaker_timeout' => env('MASTER_API_CIRCUIT_BREAKER_TIMEOUT', 300),
    
    // Retry
    'retry_max_attempts' => env('MASTER_API_RETRY_MAX_ATTEMPTS', 3),
    'retry_initial_delay' => env('MASTER_API_RETRY_INITIAL_DELAY', 300),
],
```

---

## Monitoring

### Health Check Endpoint

```php
// GET /admin/database-sync/health

$service = app(DatabaseSyncMonitoringService::class);
$health = $service->checkDatabaseHealth();
$apiHealth = $service->checkMasterApiHealth();

// Response:
{
    "status": "healthy", // or "warning", "critical"
    "databases": {
        "kkn": { "status": "connected", "latency_ms": 5 },
        "master": { "status": "connected", "latency_ms": 50 }
    },
    "master_api": {
        "api_status": "UP",
        "circuit_breaker": {
            "status": "CLOSED",
            "failures": 0
        },
        "last_sync": {
            "mahasiswa": {
                "total_syncs": 150,
                "success_rate": 98.5
            }
        }
    }
}
```

### Dashboard Metrics

```
┌─────────────────────────────────────────────────────────┐
│              Database Sync Dashboard                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Overall Status: ● HEALTHY                               │
│                                                          │
│  ┌─────────────┬─────────────┬─────────────┐           │
│  │ KKN DB      │ Master DB   │ Redis       │           │
│  │ ● Connected │ ● Connected │ ● Connected │           │
│  │ 5ms         │ 50ms        │ 2ms         │           │
│  └─────────────┴─────────────┴─────────────┘           │
│                                                          │
│  Circuit Breaker: CLOSED                                 │
│  Failures: 0/5                                           │
│                                                          │
│  Sync Statistics (Last 7 Days)                          │
│  ┌───────────────────────────────────────────┐          │
│  │ Mahasiswa: 150 syncs, 98.5% success       │          │
│  │ Dosen:     45 syncs, 100% success         │          │
│  │                                            │          │
│  │ Recent Failures: 2                         │          │
│  │ - Timeout (1)                              │          │
│  │ - Connection refused (1)                   │          │
│  └───────────────────────────────────────────┘          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Logging

```php
// Log levels for different scenarios

// Info: Normal operations
Log::info('Sync completed successfully', ['entity' => 'mahasiswa', 'count' => 150]);

// Warning: Circuit breaker about to open
Log::warning('Circuit breaker: 4/5 failures', ['endpoint' => '/sync/mahasiswa']);

// Error: API completely unavailable
Log::error('Master API unavailable', [
    'error' => 'Connection timeout',
    'fallback' => 'using local database'
]);
```

---

## Troubleshooting

### Circuit Breaker Open

**Symptom:** API calls immediately return fallback data

**Check:**
```bash
# Check circuit breaker status
curl http://localhost:8000/admin/database-sync/health

# Check cache
php artisan tinker
>>> Cache::get('master_api_circuit_breaker_...')
>>> Cache::get('master_api_circuit_breaker_..._time')
```

**Fix:**
```bash
# Clear circuit breaker cache
php artisan cache:clear master_api_circuit_breaker_*

# Or wait for timeout (5 minutes by default)
```

### High Failure Rate

**Symptom:** Frequent fallback to local database

**Check:**
```bash
# View sync logs
SELECT * FROM database_sync_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;

# Check error patterns
SELECT error_message, COUNT(*) as count 
FROM database_sync_logs 
WHERE status = 'failed' 
GROUP BY error_message;
```

**Fix:**
1. Check Master API health
2. Increase timeout if needed
3. Check network connectivity
4. Review retry configuration

### Slow Response Times

**Symptom:** API responds but very slowly

**Check:**
```bash
# Check latency in health endpoint
curl http://localhost:8000/admin/database-sync/health | jq '.databases.master.latency_ms'
```

**Fix:**
1. Check Master API server load
2. Optimize query parameters (use `since` for incremental sync)
3. Increase cache duration
4. Consider pagination for large datasets

### Cache Miss

**Symptom:** Fallback always goes to database

**Check:**
```bash
# Check if cache is working
php artisan tinker
>>> Cache::get('master_api_fallback_...')
```

**Fix:**
```bash
# Ensure Redis is running
redis-cli ping

# Check cache configuration
php artisan config:cache
```

---

## Best Practices

### 1. Always Use Fallback

```php
// ✅ GOOD: With fallback
$data = $service->getWithDatabaseFallback('mahasiswa', $params);

// ❌ BAD: No fallback
$data = $service->get('/sync/mahasiswa', $params);
```

### 2. Monitor Circuit Breaker

```php
// Check before critical operations
$health = $service->healthCheck();

if ($health['circuit_breaker']['status'] === 'OPEN') {
    // Notify admin or take alternative action
    Log::warning('Circuit breaker open during critical operation');
}
```

### 3. Use Incremental Sync

```php
// ✅ GOOD: Incremental with 'since' parameter
$lastSync = Cache::get('last_sync_mahasiswa');
$data = $service->getSyncMahasiswa(since: $lastSync);

// ❌ BAD: Full sync every time
$data = $service->getSyncMahasiswa();
```

### 4. Log Fallback Usage

```php
$data = $service->get('/endpoint');

if (empty($data)) {
    Log::info('Using fallback data', [
        'endpoint' => '/endpoint',
        'reason' => 'circuit_breaker_open'
    ]);
}
```

### 5. Test Failure Scenarios

```php
// In tests
it('handles API failure gracefully', function () {
    Http::fake([
        '/auth/token' => Http::response(['token' => 'fake'], 200),
        '/sync/mahasiswa*' => Http::response(null, 500),
    ]);

    $service = app(MasterApiService::class);
    $result = $service->getSyncMahasiswa();

    // Should return fallback data, not throw exception
    expect($result)->toBeArray();
});
```

---

## API Reference

### MasterApiService Methods

| Method | Fallback | Retry | Description |
|--------|----------|-------|-------------|
| `get()` | Cache | ✅ | Basic GET with fallback |
| `getWithDatabaseFallback()` | Cache + DB | ✅ | GET with DB fallback |
| `getSyncDosen()` | DB | ✅ | Sync dosen |
| `getSyncMahasiswa()` | DB | ✅ | Sync mahasiswa |
| `healthCheck()` | ❌ | ❌ | Health check |
| `getToken()` | Cache | ✅ | Get JWT token |

### DatabaseSyncMonitoringService Methods

| Method | Description |
|--------|-------------|
| `checkDatabaseHealth()` | Check all DB connections |
| `checkMasterApiHealth()` | Check Master API health |
| `getLastSyncStatistics()` | Get sync stats |
| `getSyncDashboard()` | Dashboard data |
| `retryFailedSyncs()` | Retry failed syncs |
| `cleanupOldLogs()` | Cleanup old logs |

---

**Last Updated:** 2026-04-10
