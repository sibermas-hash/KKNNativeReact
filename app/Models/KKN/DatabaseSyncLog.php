<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Model;

class DatabaseSyncLog extends Model
{
    protected $table = 'database_sync_logs';

    protected $fillable = [
    'source',
    'target',
    'entity_type',
    'entity_id',
    'action',
    'status',
    'request_data',
    'response_data',
    'error_message',
    'synced_at',
    'synced_by',
];

    protected $casts = [
    'request_data' => 'array',
    'response_data' => 'array',
    'synced_at' => 'datetime',
];

/**
     * Scope untuk sync yang berhasil
     */
    public function scopeSuccessful($query)
    {
        return $query->where('status', 'success');
    }

    /**
     * Scope untuk sync yang gagal
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope untuk entity type tertentu
     */
    public function scopeForEntityType($query, string $entityType)
    {
        return $query->where('entity_type', $entityType);
    }

    /**
     * Log sync berhasil
     */
    public static function logSuccess(
        string $source,
        string $target,
        string $entityType,
        ?string $entityId,
        string $action,
        array $requestData = [],
        array $responseData = [],
        ?int $syncedBy = null
    ): self {
        return self::create([
            'source' => $source,
            'target' => $target,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'action' => $action,
            'status' => 'success',
            'request_data' => $requestData,
            'response_data' => $responseData,
            'error_message' => null,
            'synced_at' => now(),
            'synced_by' => $syncedBy ?? auth()->id(),
        ]);
    }

    /**
     * Log sync gagal
     */
    public static function logFailed(
        string $source,
        string $target,
        string $entityType,
        ?string $entityId,
        string $action,
        string $errorMessage,
        array $requestData = [],
        ?int $syncedBy = null
    ): self {
        return self::create([
            'source' => $source,
            'target' => $target,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'action' => $action,
            'status' => 'failed',
            'request_data' => $requestData,
            'response_data' => [],
            'error_message' => $errorMessage,
            'synced_at' => now(),
            'synced_by' => $syncedBy ?? auth()->id(),
        ]);
    }

    /**
     * Get sync statistics
     */
    public static function getStatistics(string $entityType, ?string $period = null): array
    {
        $query = self::query()->forEntityType($entityType);

        if ($period) {
            $query->where('created_at', '>=', now()->subDays((int) $period));
        }

        $total = $query->count();
        $successful = (clone $query)->successful()->count();
        $failed = (clone $query)->failed()->count();
        $successRate = $total > 0 ? round(($successful / $total) * 100, 2) : 0;

        $recentFailures = (clone $query)
            ->failed()
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        return [
            'total' => $total,
            'successful' => $successful,
            'failed' => $failed,
            'success_rate' => $successRate,
            'recent_failures' => $recentFailures,
        ];
    }
}
