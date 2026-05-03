<?php

namespace App\Models\KKN;

use App\Models\User;
use App\Traits\ScopedByPeriode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Attendance extends Model
{
    use HasFactory, ScopedByPeriode, SoftDeletes;

    protected $table = 'attendances';

    protected $fillable = [
        'user_id',
        'peserta_kkn_id',
        'kelompok_id',
        'periode_id',
        'latitude',
        'longitude',
        'accuracy_meters',
        'altitude_meters',
        'heading_degrees',
        'speed_mps',
        'timestamp_client',
        'timestamp_server',
        'timestamp_gps',
        'activity_type',
        'status',
        'is_within_geofence',
        'distance_from_posko',
        'validation_flags',
        'device_signature',
        'ip_address',
        'user_agent',
        'attempts',
        'sync_error',
        'verified_by_user_id',
        'verified_at',
        'verification_notes',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'accuracy_meters' => 'decimal:2',
        'altitude_meters' => 'decimal:2',
        'heading_degrees' => 'decimal:2',
        'speed_mps' => 'decimal:2',
        'distance_from_posko' => 'decimal:2',
        'timestamp_client' => 'datetime',
        'timestamp_server' => 'datetime',
        'timestamp_gps' => 'datetime',
        'verified_at' => 'datetime',
        'validation_flags' => 'json',
        'is_within_geofence' => 'boolean',
    ];

    // ─── RELATIONSHIPS ───────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pesertaKkn(): BelongsTo
    {
        return $this->belongsTo(PesertaKkn::class);
    }

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(KelompokKkn::class, 'kelompok_id');
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class);
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by_user_id');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(AttendancePhoto::class);
    }

    public function syncLogs(): HasMany
    {
        return $this->hasMany(AttendanceSyncLog::class);
    }

    // ─── SCOPES ──────────────────────────────────────────────────

    public function scopeVerified($query)
    {
        return $query->where('status', 'verified');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending_verification');
    }

    public function scopeWithinGeofence($query)
    {
        return $query->where('is_within_geofence', true);
    }

    public function scopeFlagged($query)
    {
        return $query->where('status', 'flagged_anomaly');
    }

    public function scopeForPeriod($query, $periodeId)
    {
        return $query->where('periode_id', $periodeId);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForActivityType($query, $type)
    {
        return $query->where('activity_type', $type);
    }

    // ─── METHODS ──────────────────────────────────────────────────

    /**
     * Check if attendance has GPS accuracy issues
     */
    public function hasAccuracyIssue(): bool
    {
        return $this->accuracy_meters !== null && $this->accuracy_meters > 100;
    }

    /**
     * Get all validation flags
     */
    public function getValidationFlags(): array
    {
        return $this->validation_flags ?? [];
    }

    /**
     * Check if attendance was created offline (offline sync)
     */
    public function wasCreatedOffline(): bool
    {
        $clientTime = $this->timestamp_client->timestamp;
        $serverTime = $this->timestamp_server->timestamp;

        // If time difference > 5 minutes, likely offline
        return abs($serverTime - $clientTime) > 300;
    }

    /**
     * Calculate distance from posko (if needed)
     */
    public function calculateDistanceFromPosko(): ?float
    {
        if (! $this->kelompok || ! $this->kelompok->posko) {
            return null;
        }

        return $this->haversineDistance(
            $this->latitude,
            $this->longitude,
            $this->kelompok->posko->latitude,
            $this->kelompok->posko->longitude
        );
    }

    /**
     * Haversine formula for GPS distance calculation
     */
    private function haversineDistance($lat1, $lon1, $lat2, $lon2): float
    {
        $earthRadius = 6371000; // meters

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Check if speed indicates impossible travel
     */
    public function hasSpeedAnomaly(): bool
    {
        if (! $this->speed_mps) {
            return false;
        }

        // Max speed 50 m/s (180 km/h - highway speed)
        return $this->speed_mps > 50;
    }
}
