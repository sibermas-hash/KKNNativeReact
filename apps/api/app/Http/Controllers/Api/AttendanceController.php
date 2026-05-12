<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KKN\Attendance;
use App\Models\KKN\AttendancePhoto;
use App\Models\KKN\AttendanceSyncLog;
use App\Models\KKN\PesertaKkn;
use App\Services\KKN\AttendanceValidationService;
use App\Services\KKN\FraudDetectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Facades\Image;

class AttendanceController extends Controller
{
    private AttendanceValidationService $validationService;

    private FraudDetectionService $fraudService;

    public function __construct(
        AttendanceValidationService $validationService,
        FraudDetectionService $fraudService
    ) {
        $this->validationService = $validationService;
        $this->fraudService = $fraudService;
    }

    /**
     * POST /api/attendance - Create new attendance record
     *
     * This is the main endpoint for capturing attendance (GPS, photos, etc)
     * Supports both online and offline submission
     */
    public function store(Request $request): JsonResponse
    {
        // Validate input
        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'accuracy_meters' => 'nullable|numeric|min:0',
            'altitude_meters' => 'nullable|numeric',
            'heading_degrees' => 'nullable|numeric|between:0,360',
            'speed_mps' => 'nullable|numeric|min:0',
            'timestamp_client' => 'required|date_format:Y-m-d\TH:i:s.000\Z',
            'timestamp_gps' => 'nullable|date_format:Y-m-d\TH:i:s.000\Z',
            'activity_type' => 'required|in:absen_masuk,absen_keluar,logbook_activity,workshop_attendance,meeting_attendance',
            'proof_photo_base64' => 'nullable|string|max:5000000', // ~5MB
            'device_signature' => 'nullable|string',
            'user_agent' => 'nullable|string',
        ]);

        $user = auth()->user();
        $pesertaKkn = PesertaKkn::where('user_id', $user->id)
            ->where('status', 'approved')
            ->first();

        if (! $pesertaKkn) {
            return response()->json([
                'success' => false,
                'message' => 'Anda belum terdaftar sebagai peserta KKN',
            ], 403);
        }

        // Create attendance record
        $attendance = new Attendance([
            'user_id' => $user->id,
            'peserta_kkn_id' => $pesertaKkn->id,
            'kelompok_id' => $pesertaKkn->kelompok_id,
            'periode_id' => $pesertaKkn->periode_id,
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'accuracy_meters' => $validated['accuracy_meters'],
            'altitude_meters' => $validated['altitude_meters'],
            'heading_degrees' => $validated['heading_degrees'],
            'speed_mps' => $validated['speed_mps'],
            'timestamp_client' => $validated['timestamp_client'],
            'timestamp_gps' => $validated['timestamp_gps'],
            'timestamp_server' => now(),
            'activity_type' => $validated['activity_type'],
            'device_signature' => $validated['device_signature'],
            'user_agent' => $validated['user_agent'],
            'ip_address' => $request->ip(),
        ]);

        // Run validations
        $validationResult = $this->validationService->validate($attendance);
        $fraudAnalysis = $this->fraudService->analyze($attendance);

        // Store fraud risk in attendance
        $attendance->validation_flags = array_merge(
            $attendance->validation_flags ?? [],
            ['fraud_indicators' => $fraudAnalysis['indicators']]
        );

        // Save attendance
        $attendance->save();

        // Save sync log
        $syncLog = new AttendanceSyncLog([
            'user_id' => $user->id,
            'attendance_id' => $attendance->id,
            'action' => 'create',
            'status' => 'success',
            'sync_method' => 'api_call',
            'was_offline_at_creation' => false,
            'client_ip' => $request->ip(),
            'device_signature' => $validated['device_signature'],
            'first_attempt_at' => now(),
            'last_attempt_at' => now(),
            'attempt_number' => 1,
            'retry_strategy' => 'exponential_backoff',
        ]);
        $syncLog->save();

        // Handle photo if provided
        if ($request->filled('proof_photo_base64')) {
            $this->saveAttendancePhoto($attendance, $validated['proof_photo_base64']);
        }

        return response()->json([
            'success' => true,
            'message' => $this->validationService->getValidationMessage($attendance),
            'data' => [
                'attendance_id' => $attendance->id,
                'status' => $attendance->status,
                'is_within_geofence' => $attendance->is_within_geofence,
                'distance_from_posko' => $attendance->distance_from_posko,
                'validation_message' => $this->validationService->getValidationMessage($attendance),
                'requires_manual_review' => $fraudAnalysis['risk_score'] >= 60,
                'fraud_risk_score' => $fraudAnalysis['risk_score'],
            ],
        ], 201);
    }

    /**
     * GET /api/attendance - List user's attendance records
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();

        $attendances = Attendance::where('user_id', $user->id)
            ->when($request->filled('activity_type'), function ($q) use ($request) {
                return $q->where('activity_type', $request->activity_type);
            })
            ->when($request->filled('status'), function ($q) use ($request) {
                return $q->where('status', $request->status);
            })
            ->when($request->filled('periode_id'), function ($q) use ($request) {
                return $q->where('periode_id', $request->periode_id);
            })
            ->orderByDesc('timestamp_client')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $attendances,
        ]);
    }

    /**
     * GET /api/attendance/{id} - Show single attendance record
     */
    public function show(Attendance $attendance): JsonResponse
    {
        // Only allow user to view their own attendance
        if ($attendance->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke record ini',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $attendance->load(['photos', 'syncLogs']),
        ]);
    }

    /**
     * GET /api/attendance-sync-status - Get sync status for offline data
     */
    public function getSyncStatus(Request $request): JsonResponse
    {
        $user = auth()->user();

        $syncStats = AttendanceSyncLog::where('user_id', $user->id)
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN status = 'retry_pending' THEN 1 ELSE 0 END) as pending_retry,
                SUM(CASE WHEN status = 'manual_intervention_needed' THEN 1 ELSE 0 END) as needs_manual
            ")
            ->first();

        $pendingRetries = AttendanceSyncLog::where('user_id', $user->id)
            ->dueForRetry()
            ->get();

        return response()->json([
            'success' => true,
            'sync_stats' => $syncStats,
            'pending_retries_count' => $pendingRetries->count(),
            'pending_retries' => $pendingRetries->map(function ($log) {
                return [
                    'id' => $log->id,
                    'attendance_id' => $log->attendance_id,
                    'next_retry_at' => $log->next_retry_scheduled_at,
                    'attempt_number' => $log->attempt_number,
                    'last_error' => $log->last_error_message,
                ];
            }),
        ]);
    }

    /**
     * POST /api/attendance-retry-sync - Manually trigger sync for offline records
     */
    public function retrySync(Request $request): JsonResponse
    {
        $user = auth()->user();

        $retryLogs = AttendanceSyncLog::where('user_id', $user->id)
            ->where(function ($q) {
                $q->where('status', 'retry_pending')
                  ->orWhere('status', 'manual_intervention_needed');
            })
            ->limit(50)
            ->get();

        // In real implementation, would retry each failed sync
        // For now, just reset status
        foreach ($retryLogs as $log) {
            if ($log->status === 'manual_intervention_needed') {
                continue; // Don't auto-retry these
            }

            $log->status = 'retry_pending';
            $log->next_retry_scheduled_at = now()->addSeconds(5);
            $log->save();
        }

        return response()->json([
            'success' => true,
            'message' => "{$retryLogs->count()} records queued untuk retry",
            'queued_count' => $retryLogs->count(),
        ]);
    }

    /**
     * Save attendance photo with EXIF extraction
     */
    private function saveAttendancePhoto(Attendance $attendance, string $base64): void
    {
        try {
            // Decode base64
            $imageData = base64_decode(explode(',', $base64)[1] ?? $base64);

            if (! $imageData) {
                return;
            }

            // SECURITY: Cap decoded size at 4MB to prevent memory exhaustion
            if (strlen($imageData) > 4 * 1024 * 1024) {
                \Log::warning('Attendance photo rejected: decoded size exceeds 4MB', [
                    'attendance_id' => $attendance->id,
                    'size_bytes' => strlen($imageData),
                ]);

                return;
            }

            // SECURITY: Validate MIME type of decoded bytes before image processing
            $finfo = new \finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->buffer($imageData);
            $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (! in_array($mimeType, $allowedMimes, true)) {
                \Log::warning('Attendance photo rejected: invalid MIME type', [
                    'attendance_id' => $attendance->id,
                    'mime' => $mimeType,
                ]);

                return;
            }

            // Generate filename
            $filename = "{$attendance->id}_".Str::random(8).'.jpg';
            $path = "attendance/{$filename}";

            // Compress image
            $image = Image::make($imageData)->orientate();
            $image->resize(1920, 1440, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });

            // X-003 fix (audit): write to the PRIVATE disk. These are GPS-
            // stamped selfies of students at KKN sites — PII that must not be
            // served via the world-readable `public` disk. Served to
            // authenticated callers via PrivateFileController instead.
            Storage::disk('local')->put($path, $image->stream('jpg', 80));

            // Extract EXIF data if available
            $exifData = $this->extractExifData($imageData);

            // Create photo record
            AttendancePhoto::create([
                'attendance_id' => $attendance->id,
                'path' => $path,
                'filename' => $filename,
                'file_size_bytes' => Storage::disk('local')->size($path),
                'mime_type' => 'image/jpeg',
                'exif_data' => $exifData,
                'exif_latitude' => $exifData['latitude'] ?? null,
                'exif_longitude' => $exifData['longitude'] ?? null,
                'exif_timestamp' => $exifData['datetime'] ?? null,
                'photo_type' => 'selfie',
                'status' => 'pending_review',
            ]);
        } catch (\Exception $e) {
            \Log::warning('Failed to save attendance photo: '.$e->getMessage());
        }
    }

    /**
     * Extract EXIF metadata from image
     */
    private function extractExifData(string $imageData): array
    {
        try {
            $exif = @exif_read_data('data://image/jpeg;base64,'.base64_encode($imageData));

            if (! $exif) {
                return [];
            }

            $data = [
                'make' => $exif['Make'] ?? null,
                'model' => $exif['Model'] ?? null,
                'datetime' => $exif['DateTime'] ?? null,
                'orientation' => $exif['Orientation'] ?? null,
            ];

            // Extract GPS if available
            if (isset($exif['GPSLatitude']) && isset($exif['GPSLongitude'])) {
                $data['latitude'] = $this->gpsToDecimal($exif['GPSLatitude'], $exif['GPSLatitudeRef'] ?? 'N');
                $data['longitude'] = $this->gpsToDecimal($exif['GPSLongitude'], $exif['GPSLongitudeRef'] ?? 'E');
            }

            return $data;
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Convert GPS coordinates to decimal format
     */
    private function gpsToDecimal(array $gps, string $direction): float
    {
        $degrees = $gps[0];
        $minutes = $gps[1];
        $seconds = $gps[2];

        $decimal = $degrees + ($minutes / 60) + ($seconds / 3600);

        return ($direction === 'S' || $direction === 'W') ? -$decimal : $decimal;
    }
}
