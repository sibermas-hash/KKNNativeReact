<?php
// app/Services/ReportManagementService.php

namespace App\Services;

use App\Models\Report;
use App\Models\User;
use App\Notifications\ReportStatusUpdated;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReportManagementService
{
    /**
     * Report types configuration
     */
    private const REPORT_TYPES = [
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
        'activity_proposal' => [
            'name' => 'Proposal Kegiatan',
            'max_size' => 10485760, // 10MB
            'allowed_types' => ['pdf', 'docx'],
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
    ): Report {
        // Validate report type
        if (!isset(self::REPORT_TYPES[$type])) {
            throw new \InvalidArgumentException("Invalid report type: {$type}");
        }

        $config = self::REPORT_TYPES[$type];

        // Validate file size
        if ($file->getSize() > $config['max_size']) {
            $maxSizeMB = $config['max_size'] / 1048576;
            throw new \InvalidArgumentException("File size exceeds maximum allowed size of {$maxSizeMB}MB");
        }

        // Validate file type
        $extension = $file->getClientOriginalExtension();
        if (!in_array(strtolower($extension), $config['allowed_types'])) {
            $allowedTypes = implode(', ', $config['allowed_types']);
            throw new \InvalidArgumentException("Invalid file type. Allowed types: {$allowedTypes}");
        }

        return DB::transaction(function () use ($userId, $groupId, $type, $file, $title, $description) {
            // Generate unique filename
            $filename = $this->generateFilename($userId, $type, $file);

            // Store file
            $path = $file->storeAs(
                "reports/{$groupId}/{$type}",
                $filename,
                'private'
            );

            // Create report record
            $report = Report::create([
                'user_id' => $userId,
                'group_id' => $groupId,
                'type' => $type,
                'title' => $title,
                'description' => $description,
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'status' => 'draft',
            ]);

            return $report;
        });
    }

    /**
     * Submit report for review
     */
    public function submitForReview(int $reportId, int $userId): Report
    {
        return DB::transaction(function () use ($reportId, $userId) {
            $report = Report::where('id', $reportId)
                ->where('user_id', $userId)
                ->firstOrFail();

            if ($report->status !== 'draft') {
                throw new \InvalidArgumentException("Report must be in draft status to submit");
            }

            $report->update([
                'status' => 'submitted',
                'submitted_at' => now(),
            ]);

            // Notify DPL
            $this->notifyDPL($report);

            return $report->fresh();
        });
    }

    /**
     * Review a report (approve/reject/request revision)
     */
    public function reviewReport(
        int $reportId,
        int $reviewerId,
        string $action,
        ?string $feedback = null
    ): Report {
        $allowedActions = ['approved', 'rejected', 'revision_required'];
        
        if (!in_array($action, $allowedActions)) {
            throw new \InvalidArgumentException("Invalid action. Allowed: " . implode(', ', $allowedActions));
        }

        return DB::transaction(function () use ($reportId, $reviewerId, $action, $feedback) {
            $report = Report::findOrFail($reportId);

            $report->update([
                'status' => $action,
                'feedback' => $feedback,
                'reviewed_by' => $reviewerId,
                'reviewed_at' => now(),
            ]);

            // Notify student
            $report->user->notify(new ReportStatusUpdated($report));

            return $report->fresh();
        });
    }

    /**
     * Update existing report (for revisions)
     */
    public function updateReport(
        int $reportId,
        int $userId,
        UploadedFile $file,
        ?string $title = null,
        ?string $description = null
    ): Report {
        return DB::transaction(function () use ($reportId, $userId, $file, $title, $description) {
            $report = Report::where('id', $reportId)
                ->where('user_id', $userId)
                ->firstOrFail();

            // Only allow updates for draft or revision_required status
            if (!in_array($report->status, ['draft', 'revision_required'])) {
                throw new \InvalidArgumentException("Report cannot be updated in current status");
            }

            // Delete old file
            if (Storage::disk('private')->exists($report->file_path)) {
                Storage::disk('private')->delete($report->file_path);
            }

            // Upload new file
            $filename = $this->generateFilename($userId, $report->type, $file);
            $path = $file->storeAs(
                "reports/{$report->group_id}/{$report->type}",
                $filename,
                'private'
            );

            // Update report
            $report->update([
                'title' => $title ?? $report->title,
                'description' => $description ?? $report->description,
                'file_path' => $path,
                'file_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'status' => 'draft',
                'feedback' => null,
                'reviewed_by' => null,
                'reviewed_at' => null,
            ]);

            return $report->fresh();
        });
    }

    /**
     * Get student's report progress
     */
    public function getStudentReportProgress(int $userId, int $groupId): array
    {
        $reports = Report::where('user_id', $userId)
            ->where('group_id', $groupId)
            ->get()
            ->keyBy('type');

        $progress = [];
        foreach (self::REPORT_TYPES as $type => $config) {
            $report = $reports->get($type);
            
            $progress[] = [
                'type' => $type,
                'name' => $config['name'],
                'required' => true,
                'status' => $report ? $report->status : 'not_started',
                'report' => $report ? [
                    'id' => $report->id,
                    'title' => $report->title,
                    'submitted_at' => $report->submitted_at,
                    'reviewed_at' => $report->reviewed_at,
                    'feedback' => $report->feedback,
                ] : null,
            ];
        }

        $totalReports = count(self::REPORT_TYPES);
        $completedReports = collect($progress)->where('status', 'approved')->count();

        return [
            'reports' => $progress,
            'total_required' => $totalReports,
            'completed' => $completedReports,
            'completion_percentage' => ($completedReports / $totalReports) * 100,
        ];
    }

    /**
     * Get group reports summary (for DPL)
     */
    public function getGroupReportsSummary(int $groupId): array
    {
        $reports = Report::where('group_id', $groupId)
            ->with(['user:id,name,nim'])
            ->get();

        $summary = [
            'total_reports' => $reports->count(),
            'by_status' => [
                'draft' => $reports->where('status', 'draft')->count(),
                'submitted' => $reports->where('status', 'submitted')->count(),
                'under_review' => $reports->where('status', 'under_review')->count(),
                'approved' => $reports->where('status', 'approved')->count(),
                'rejected' => $reports->where('status', 'rejected')->count(),
                'revision_required' => $reports->where('status', 'revision_required')->count(),
            ],
            'by_type' => [],
            'pending_review' => $reports->where('status', 'submitted')->values(),
        ];

        foreach (self::REPORT_TYPES as $type => $config) {
            $typeReports = $reports->where('type', $type);
            $summary['by_type'][$type] = [
                'name' => $config['name'],
                'total' => $typeReports->count(),
                'approved' => $typeReports->where('status', 'approved')->count(),
                'pending' => $typeReports->whereIn('status', ['submitted', 'under_review'])->count(),
            ];
        }

        return $summary;
    }

    /**
     * Delete a report
     */
    public function deleteReport(int $reportId, int $userId): bool
    {
        return DB::transaction(function () use ($reportId, $userId) {
            $report = Report::where('id', $reportId)
                ->where('user_id', $userId)
                ->firstOrFail();

            // Only allow deletion of draft or rejected reports
            if (!in_array($report->status, ['draft', 'rejected'])) {
                throw new \InvalidArgumentException("Cannot delete report in current status");
            }

            // Delete file
            if (Storage::disk('private')->exists($report->file_path)) {
                Storage::disk('private')->delete($report->file_path);
            }

            return $report->delete();
        });
    }

    /**
     * Generate unique filename
     */
    private function generateFilename(int $userId, string $type, UploadedFile $file): string
    {
        $timestamp = now()->format('YmdHis');
        $extension = $file->getClientOriginalExtension();
        return "{$userId}_{$type}_{$timestamp}.{$extension}";
    }

    /**
     * Notify DPL about new submission
     */
    private function notifyDPL(Report $report): void
    {
        $dpl = $report->group->dpl;
        // Implementation depends on your notification system
        // $dpl->notify(new ReportSubmitted($report));
    }

    /**
     * Get download URL for a report
     */
    public function getDownloadUrl(int $reportId, int $userId): string
    {
        $report = Report::findOrFail($reportId);

        // Check authorization (user is owner or DPL of the group)
        $user = User::findOrFail($userId);
        if ($report->user_id !== $userId && $report->group->dpl_id !== $userId) {
            throw new \UnauthorizedException("Not authorized to download this report");
        }

        return Storage::disk('private')->temporaryUrl(
            $report->file_path,
            now()->addMinutes(5)
        );
    }
}
