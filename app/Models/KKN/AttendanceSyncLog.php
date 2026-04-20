<?php

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceSyncLog extends Model
{
    protected $table = 'attendance_sync_logs';

    protected $fillable = [
        'user_id',
        'attendance_id',
        'action',
        'status',
        'sync_method',
        'was_offline_at_creation',
        'client_ip',
        'device_signature',
        'attempt_number',
        'first_attempt_at',
        'last_attempt_at',
        'total_retry_seconds',
        'last_http_status_code',
        'last_error_message',
        'last_error_details',
        'retry_strategy',
        'next_retry_scheduled_at',
        'browser_name',
        'browser_version',
        'os_name',
        'is_mobile',
        'request_payload',
        'response_payload',
    ];

    protected $casts = [
        'first_attempt_at' => 'datetime',
        'last_attempt_at' => 'datetime',
        'next_retry_scheduled_at' => 'datetime',
        'was_offline_at_creation' => 'boolean',
        'is_mobile' => 'boolean',
        'last_error_details' => 'json',
        'request_payload' => 'json',
        'response_payload' => 'json',
    ];

    // ─── RELATIONSHIPS ───────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function attendance(): BelongsTo
    {
        return $this->belongsTo(Attendance::class);
    }

    // ─── SCOPES ──────────────────────────────────────────────────

    public function scopeSuccessful($query)
    {
        return $query->where('status', 'success');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeRetryPending($query)
    {
        return $query->where('status', 'retry_pending');
    }

    public function scopeOfflineCreated($query)
    {
        return $query->where('was_offline_at_creation', true);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForMethod($query, $method)
    {
        return $query->where('sync_method', $method);
    }

    public function scopeDueForRetry($query)
    {
        return $query->where('status', 'retry_pending')
            ->where('next_retry_scheduled_at', '<=', now());
    }

    // ─── METHODS ──────────────────────────────────────────────────

    /**
     * Record a failed sync attempt
     */
    public function recordFailure($httpStatus, $errorMessage, $errorDetails = null): void
    {
        $this->attempt_number++;
        $this->last_attempt_at = now();
        $this->last_http_status_code = $httpStatus;
        $this->last_error_message = $errorMessage;
        $this->last_error_details = $errorDetails;
        $this->status = 'failed';

        // Calculate next retry time based on strategy
        $this->calculateNextRetry();

        $this->save();
    }

    /**
     * Record a successful sync
     */
    public function recordSuccess($responsePayload = null): void
    {
        $this->status = 'success';
        $this->last_attempt_at = now();
        $this->total_retry_seconds = $this->last_attempt_at->diffInSeconds($this->first_attempt_at);
        $this->response_payload = $responsePayload;
        $this->next_retry_scheduled_at = null;

        $this->save();
    }

    /**
     * Calculate next retry time based on strategy
     */
    private function calculateNextRetry(): void
    {
        $this->status = 'retry_pending';

        $delay = match ($this->retry_strategy) {
            'exponential_backoff' => 60 * (2 ** ($this->attempt_number - 1)), // 1m, 2m, 4m, 8m, etc
            'fixed_interval' => 300, // 5 minutes
            'immediate' => 5, // 5 seconds
            'manual' => null,
            default => 300,
        };

        if ($delay) {
            $this->next_retry_scheduled_at = now()->addSeconds($delay);

            // Cap at 1 hour max
            if ($this->next_retry_scheduled_at->diffInMinutes(now()) > 60) {
                $this->next_retry_scheduled_at = now()->addHours(1);
            }
        }

        // After 5 attempts, mark for manual intervention
        if ($this->attempt_number >= 5) {
            $this->status = 'manual_intervention_needed';
            $this->next_retry_scheduled_at = null;
        }
    }

    /**
     * Get human-readable sync method
     */
    public function getSyncMethodLabel(): string
    {
        return match ($this->sync_method) {
            'manual_button' => '📱 Tombol Manual',
            'auto_online_event' => '🔗 Auto Deteksi Koneksi',
            'scheduled_retry' => '⏰ Retry Otomatis',
            'api_call' => '🔌 API Call',
            default => $this->sync_method,
        };
    }

    /**
     * Get device info string
     */
    public function getDeviceInfo(): string
    {
        $parts = [];

        if ($this->browser_name) {
            $parts[] = "{$this->browser_name} {$this->browser_version}";
        }

        if ($this->os_name) {
            $parts[] = $this->os_name;
        }

        if ($this->is_mobile) {
            $parts[] = '📱 Mobile';
        }

        return implode(' / ', $parts) ?: 'Unknown';
    }

    /**
     * Get sync status badge
     */
    public function getStatusBadge(): string
    {
        return match ($this->status) {
            'success' => '✅ Berhasil',
            'failed' => '❌ Gagal',
            'pending' => '⏳ Tertunda',
            'retry_pending' => '🔄 Menunggu Retry',
            'manual_intervention_needed' => '⚠️ Perlu Intervensi',
            default => $this->status,
        };
    }
}
