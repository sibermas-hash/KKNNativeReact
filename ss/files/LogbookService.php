<?php
// app/Services/LogbookService.php

namespace App\Services;

use App\Models\Logbook;
use App\Models\Group;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class LogbookService
{
    /**
     * Create a new logbook entry
     */
    public function createEntry(
        int $userId,
        int $groupId,
        string $activityDate,
        string $village,
        string $activityType,
        string $activityDescription,
        array $documentationFiles = []
    ): Logbook {
        return DB::transaction(function () use (
            $userId,
            $groupId,
            $activityDate,
            $village,
            $activityType,
            $activityDescription,
            $documentationFiles
        ) {
            // Upload documentation files
            $documentationPaths = [];
            foreach ($documentationFiles as $file) {
                $documentationPaths[] = $this->uploadDocumentation($userId, $groupId, $file);
            }

            $logbook = Logbook::create([
                'user_id' => $userId,
                'group_id' => $groupId,
                'activity_date' => $activityDate,
                'village' => $village,
                'activity_type' => $activityType,
                'activity_description' => $activityDescription,
                'documentation' => json_encode($documentationPaths),
                'approval_status' => 'pending',
            ]);

            return $logbook;
        });
    }

    /**
     * Update an existing logbook entry
     */
    public function updateEntry(
        int $logbookId,
        int $userId,
        array $data
    ): Logbook {
        return DB::transaction(function () use ($logbookId, $userId, $data) {
            $logbook = Logbook::where('id', $logbookId)
                ->where('user_id', $userId)
                ->firstOrFail();

            // Only allow updates for pending or rejected entries
            if (!in_array($logbook->approval_status, ['pending', 'rejected'])) {
                throw new \InvalidArgumentException("Cannot update logbook in current status");
            }

            // Handle new documentation files if provided
            if (isset($data['new_documentation']) && is_array($data['new_documentation'])) {
                $existingDocs = json_decode($logbook->documentation, true) ?? [];
                
                foreach ($data['new_documentation'] as $file) {
                    $existingDocs[] = $this->uploadDocumentation($userId, $logbook->group_id, $file);
                }
                
                $data['documentation'] = json_encode($existingDocs);
                unset($data['new_documentation']);
            }

            // Reset approval status when updating
            $data['approval_status'] = 'pending';
            $data['approved_by'] = null;
            $data['approved_at'] = null;
            $data['feedback'] = null;

            $logbook->update($data);

            return $logbook->fresh();
        });
    }

    /**
     * Approve or reject logbook entry
     */
    public function reviewEntry(
        int $logbookId,
        int $reviewerId,
        string $action,
        ?string $feedback = null
    ): Logbook {
        $allowedActions = ['approved', 'rejected', 'revision_required'];
        
        if (!in_array($action, $allowedActions)) {
            throw new \InvalidArgumentException("Invalid action. Allowed: " . implode(', ', $allowedActions));
        }

        return DB::transaction(function () use ($logbookId, $reviewerId, $action, $feedback) {
            $logbook = Logbook::findOrFail($logbookId);

            $logbook->update([
                'approval_status' => $action,
                'feedback' => $feedback,
                'approved_by' => $reviewerId,
                'approved_at' => now(),
            ]);

            // Notify student about the review
            // $logbook->user->notify(new LogbookReviewed($logbook));

            return $logbook->fresh();
        });
    }

    /**
     * Bulk approve logbook entries
     */
    public function bulkApprove(array $logbookIds, int $reviewerId): array
    {
        return DB::transaction(function () use ($logbookIds, $reviewerId) {
            $results = [];

            foreach ($logbookIds as $logbookId) {
                $results[] = $this->reviewEntry($logbookId, $reviewerId, 'approved');
            }

            return $results;
        });
    }

    /**
     * Get student's logbook entries
     */
    public function getStudentLogbooks(
        int $userId,
        int $groupId,
        ?string $startDate = null,
        ?string $endDate = null
    ): array {
        $query = Logbook::where('user_id', $userId)
            ->where('group_id', $groupId)
            ->orderBy('activity_date', 'desc');

        if ($startDate) {
            $query->where('activity_date', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('activity_date', '<=', $endDate);
        }

        $logbooks = $query->get();

        return [
            'entries' => $logbooks->map(function ($logbook) {
                return [
                    'id' => $logbook->id,
                    'activity_date' => $logbook->activity_date,
                    'village' => $logbook->village,
                    'activity_type' => $logbook->activity_type,
                    'activity_description' => $logbook->activity_description,
                    'documentation' => json_decode($logbook->documentation, true),
                    'approval_status' => $logbook->approval_status,
                    'feedback' => $logbook->feedback,
                    'approved_at' => $logbook->approved_at,
                ];
            }),
            'statistics' => [
                'total_entries' => $logbooks->count(),
                'approved' => $logbooks->where('approval_status', 'approved')->count(),
                'pending' => $logbooks->where('approval_status', 'pending')->count(),
                'rejected' => $logbooks->where('approval_status', 'rejected')->count(),
                'revision_required' => $logbooks->where('approval_status', 'revision_required')->count(),
            ],
        ];
    }

    /**
     * Get DPL's pending approvals dashboard
     */
    public function getDPLPendingApprovals(int $dplId): array
    {
        $groups = Group::where('dpl_id', $dplId)->get();
        $groupIds = $groups->pluck('id');

        $pendingLogbooks = Logbook::whereIn('group_id', $groupIds)
            ->where('approval_status', 'pending')
            ->with(['user:id,name,nim', 'group:id,name,village'])
            ->orderBy('activity_date', 'desc')
            ->get();

        $summary = [
            'total_pending' => $pendingLogbooks->count(),
            'by_group' => [],
            'entries' => $pendingLogbooks->map(function ($logbook) {
                return [
                    'id' => $logbook->id,
                    'student_name' => $logbook->user->name,
                    'student_nim' => $logbook->user->nim,
                    'group_name' => $logbook->group->name,
                    'village' => $logbook->village,
                    'activity_date' => $logbook->activity_date,
                    'activity_type' => $logbook->activity_type,
                    'activity_description' => $logbook->activity_description,
                    'documentation' => json_decode($logbook->documentation, true),
                    'days_pending' => now()->diffInDays($logbook->created_at),
                ];
            }),
        ];

        // Group pending entries by group
        foreach ($groups as $group) {
            $groupPending = $pendingLogbooks->where('group_id', $group->id);
            $summary['by_group'][] = [
                'group_id' => $group->id,
                'group_name' => $group->name,
                'village' => $group->village,
                'pending_count' => $groupPending->count(),
            ];
        }

        return $summary;
    }

    /**
     * Get group logbook summary
     */
    public function getGroupLogbookSummary(int $groupId): array
    {
        $logbooks = Logbook::where('group_id', $groupId)
            ->with(['user:id,name,nim'])
            ->get();

        $studentStats = [];
        $students = $logbooks->pluck('user')->unique('id');

        foreach ($students as $student) {
            $studentLogbooks = $logbooks->where('user_id', $student->id);
            
            $studentStats[] = [
                'student_id' => $student->id,
                'student_name' => $student->name,
                'student_nim' => $student->nim,
                'total_entries' => $studentLogbooks->count(),
                'approved' => $studentLogbooks->where('approval_status', 'approved')->count(),
                'pending' => $studentLogbooks->where('approval_status', 'pending')->count(),
                'rejected' => $studentLogbooks->where('approval_status', 'rejected')->count(),
                'last_entry_date' => $studentLogbooks->max('activity_date'),
            ];
        }

        return [
            'students' => $studentStats,
            'overall_statistics' => [
                'total_entries' => $logbooks->count(),
                'approved' => $logbooks->where('approval_status', 'approved')->count(),
                'pending' => $logbooks->where('approval_status', 'pending')->count(),
                'rejected' => $logbooks->where('approval_status', 'rejected')->count(),
                'revision_required' => $logbooks->where('approval_status', 'revision_required')->count(),
            ],
            'activity_types' => $this->getActivityTypeDistribution($logbooks),
        ];
    }

    /**
     * Get activity type distribution
     */
    private function getActivityTypeDistribution($logbooks): array
    {
        $distribution = [];
        $types = ['ACC', 'Tolak', 'Pending'];

        foreach ($types as $type) {
            $distribution[$type] = $logbooks->where('activity_type', $type)->count();
        }

        return $distribution;
    }

    /**
     * Delete logbook entry
     */
    public function deleteEntry(int $logbookId, int $userId): bool
    {
        return DB::transaction(function () use ($logbookId, $userId) {
            $logbook = Logbook::where('id', $logbookId)
                ->where('user_id', $userId)
                ->firstOrFail();

            // Only allow deletion of pending or rejected entries
            if (!in_array($logbook->approval_status, ['pending', 'rejected'])) {
                throw new \InvalidArgumentException("Cannot delete logbook in current status");
            }

            // Delete documentation files
            $documentation = json_decode($logbook->documentation, true);
            if ($documentation) {
                foreach ($documentation as $path) {
                    if (Storage::disk('public')->exists($path)) {
                        Storage::disk('public')->delete($path);
                    }
                }
            }

            return $logbook->delete();
        });
    }

    /**
     * Upload documentation file
     */
    private function uploadDocumentation(int $userId, int $groupId, UploadedFile $file): string
    {
        $filename = time() . '_' . $userId . '_' . $file->getClientOriginalName();
        
        return $file->storeAs(
            "logbooks/{$groupId}",
            $filename,
            'public'
        );
    }

    /**
     * Get logbook analytics for a date range
     */
    public function getAnalytics(int $groupId, string $startDate, string $endDate): array
    {
        $logbooks = Logbook::where('group_id', $groupId)
            ->whereBetween('activity_date', [$startDate, $endDate])
            ->get();

        return [
            'date_range' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
            'total_activities' => $logbooks->count(),
            'approval_rate' => $logbooks->count() > 0 
                ? ($logbooks->where('approval_status', 'approved')->count() / $logbooks->count()) * 100 
                : 0,
            'average_approval_time' => $this->calculateAverageApprovalTime($logbooks),
            'daily_breakdown' => $this->getDailyBreakdown($logbooks, $startDate, $endDate),
        ];
    }

    /**
     * Calculate average approval time in hours
     */
    private function calculateAverageApprovalTime($logbooks): float
    {
        $approvedLogbooks = $logbooks->where('approval_status', 'approved')
            ->whereNotNull('approved_at');

        if ($approvedLogbooks->isEmpty()) {
            return 0;
        }

        $totalHours = $approvedLogbooks->sum(function ($logbook) {
            return $logbook->created_at->diffInHours($logbook->approved_at);
        });

        return round($totalHours / $approvedLogbooks->count(), 2);
    }

    /**
     * Get daily activity breakdown
     */
    private function getDailyBreakdown($logbooks, string $startDate, string $endDate): array
    {
        $breakdown = [];
        $start = new \DateTime($startDate);
        $end = new \DateTime($endDate);
        $interval = new \DateInterval('P1D');
        $period = new \DatePeriod($start, $interval, $end);

        foreach ($period as $date) {
            $dateString = $date->format('Y-m-d');
            $dayLogbooks = $logbooks->where('activity_date', $dateString);

            $breakdown[] = [
                'date' => $dateString,
                'total' => $dayLogbooks->count(),
                'approved' => $dayLogbooks->where('approval_status', 'approved')->count(),
                'pending' => $dayLogbooks->where('approval_status', 'pending')->count(),
            ];
        }

        return $breakdown;
    }
}
