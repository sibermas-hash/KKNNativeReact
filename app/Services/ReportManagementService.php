<?php

namespace App\Services;

use App\Models\KKN\Laporan;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReportManagementService
{
    /**
     * Report types configuration
     */
    public const REPORT_TYPES = [
        'final_report' => [
            'name' => 'Laporan Akhir',
            'max_size' => 10485760, // 10MB
            'allowed_types' => ['pdf', 'docx'],
        ],
        'village_map' => [
            'name' => 'Peta Desa',
            'max_size' => 5242880, // 5MB
            'allowed_types' => ['pdf', 'png', 'jpg', 'jpeg'],
        ],
        'video_documentation' => [
            'name' => 'Video Kegiatan',
            'max_size' => 524288000, // 500MB
            'allowed_types' => ['mp4', 'avi', 'mov'],
        ],
        'photo_documentation' => [
            'name' => 'Foto Dokumentasi',
            'max_size' => 5242880, // 5MB
            'allowed_types' => ['png', 'jpg', 'jpeg'],
        ],
        'attendance_sheet' => [
            'name' => 'Daftar Hadir',
            'max_size' => 5242880, // 5MB
            'allowed_types' => ['pdf', 'xlsx'],
        ],
        'evaluation_report' => [
            'name' => 'Laporan Evaluasi',
            'max_size' => 10485760, // 10MB
            'allowed_types' => ['pdf', 'docx'],
        ],
    ];

    /**
     * Upload a report
     */
    public function uploadReport(
        int $userId,
        int $groupId,
        string $type,
        UploadedFile $file,
        string $title,
        ?string $description = null
    ): Laporan {
        if (!isset(self::REPORT_TYPES[$type])) {
            throw new \InvalidArgumentException("Jenis laporan tidak valid: {$type}");
        }

        $config = self::REPORT_TYPES[$type];

        if ($file->getSize() > $config['max_size']) {
            $maxSizeMB = $config['max_size'] / 1048576;
            throw new \InvalidArgumentException("Ukuran file melebihi batas maksimum {$maxSizeMB}MB");
        }

        $extension = $file->getClientOriginalExtension();
        if (!in_array(strtolower($extension), $config['allowed_types'])) {
            $allowedTypes = implode(', ', $config['allowed_types']);
            throw new \InvalidArgumentException("Jenis file tidak valid. Jenis yang diizinkan: {$allowedTypes}");
        }

        return DB::transaction(function () use ($userId, $groupId, $type, $file, $title, $description) {
            $filename = "{$userId}_{$type}_" . now()->format('YmdHis') . "." . $file->getClientOriginalExtension();

            // Issue 9 Fix: Store in private storage instead of public
            $path = $file->storeAs(
                "reports/{$groupId}/{$type}",
                $filename,
                'local'
            );

            return Laporan::create([
                'user_id' => $userId,
                'kelompok_id' => $groupId,
                'type' => $type,
                'title' => $title,
                'description' => $description,
                'file_path' => $path,
                'file_name' => strip_tags($file->getClientOriginalName()),
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'status' => 'submitted',
                'submitted_at' => now(),
            ]);
        });
    }

    /**
     * Review a report
     */
    public function reviewReport(
        int $reportId,
        int $reviewerId,
        string $action,
        ?string $feedback = null
    ): Laporan {
        $allowedActions = ['approved', 'rejected', 'revision_required'];
        
        if (!in_array($action, $allowedActions)) {
            throw new \InvalidArgumentException("Tindakan tidak valid");
        }

        return DB::transaction(function () use ($reportId, $reviewerId, $action, $feedback) {
            $report = Laporan::findOrFail($reportId);

            $report->update([
                'status' => $action,
                'feedback' => $feedback,
                'reviewed_by' => $reviewerId,
                'reviewed_at' => now(),
            ]);

            return $report->fresh();
        });
    }

    /**
     * Get student's report progress
     */
    public function getStudentReportProgress(int $userId, int $groupId): array
    {
        $reports = Laporan::where('user_id', $userId)
            ->where('kelompok_id', $groupId)
            ->get()
            ->keyBy('type');

        $progress = [];
        foreach (self::REPORT_TYPES as $type => $config) {
            $report = $reports->get($type);
            
            $progress[] = [
                'type' => $type,
                'name' => $config['name'],
                'status' => $report ? $report->status : 'not_started',
                'report' => $report,
            ];
        }

        return $progress;
    }
}
