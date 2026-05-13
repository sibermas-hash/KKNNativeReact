<?php

namespace App\Models\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\URL;

class AttendancePhoto extends Model
{
    protected $table = 'attendance_photos';

    protected $fillable = [
        'attendance_id',
        'path',
        'filename',
        'file_size_bytes',
        'mime_type',
        'exif_data',
        'exif_latitude',
        'exif_longitude',
        'exif_timestamp',
        'photo_type',
        'watermark_text',
        'facial_features',
        'qr_data',
        'status',
        'rejection_reason',
        'reviewed_by_user_id',
        'reviewed_at',
    ];

    protected $casts = [
        'exif_data' => 'json',
        'exif_latitude' => 'decimal:8',
        'exif_longitude' => 'decimal:8',
        'exif_timestamp' => 'datetime',
        'facial_features' => 'json',
        'reviewed_at' => 'datetime',
    ];

    // ─── RELATIONSHIPS ───────────────────────────────────────────

    public function attendance(): BelongsTo
    {
        return $this->belongsTo(Attendance::class);
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id')->withTrashed();
    }

    // ─── SCOPES ──────────────────────────────────────────────────

    public function scopeVerified($query)
    {
        return $query->where('status', 'verified');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending_review');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('photo_type', $type);
    }

    // ─── METHODS ──────────────────────────────────────────────────

    /**
     * Extract GPS coordinates from EXIF if available
     */
    public function getGpsCoordinates(): ?array
    {
        if ($this->exif_latitude && $this->exif_longitude) {
            return [
                'latitude' => $this->exif_latitude,
                'longitude' => $this->exif_longitude,
            ];
        }

        return null;
    }

    /**
     * Check if EXIF timestamp differs significantly from attendance timestamp
     */
    public function hasTimestampMismatch(Attendance $attendance, int $maxDiffSeconds = 300): bool
    {
        if (! $this->exif_timestamp) {
            return false;
        }

        $diff = abs($attendance->timestamp_client->diffInSeconds($this->exif_timestamp));

        return $diff > $maxDiffSeconds;
    }

    /**
     * Get file URL for display.
     *
     * X-003 fix (audit): this previously emitted a public storage URL —
     * anyone who could guess the path could download another student's
     * GPS-stamped selfie. Now it points at the authenticated download
     * route which runs the per-record authorization check.
     */
    public function getFileUrl(): string
    {
        return URL::temporarySignedRoute(
            'api.v1.files.attendance-photo',
            now()->addHours(2),
            ['photo' => $this->id],
        );
    }

    /**
     * Extract readable EXIF info
     */
    public function getReadableExifInfo(): array
    {
        if (! $this->exif_data) {
            return [];
        }

        $exif = $this->exif_data;

        return [
            'camera' => $exif['make'] ?? 'Unknown'.' '.($exif['model'] ?? ''),
            'timestamp' => $exif['datetime'] ?? null,
            'gps' => isset($exif['latitude']) && isset($exif['longitude'])
                ? "{$exif['latitude']}, {$exif['longitude']}"
                : null,
            'orientation' => $exif['orientation'] ?? null,
        ];
    }
}
