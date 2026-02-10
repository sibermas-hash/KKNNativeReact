<?php

namespace App\Services;

use App\Models\DailyReport;
use App\Models\Group;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class LogbookService
{
    /**
     * Create a new logbook entry using DailyReport model
     */
    public function createEntry(
        int $studentId,
        int $groupId,
        string $date,
        string $location,
        string $content,
        array $documentationFiles = []
    ): DailyReport {
        return DB::transaction(function () use ($studentId, $groupId, $date, $location, $content, $documentationFiles) {
            $report = DailyReport::create([
                'student_id' => $studentId,
                'group_id' => $groupId,
                'date' => $date,
                'location' => $location,
                'content' => $content,
                'status' => 'submitted',
            ]);

            // If there are files, we can handle them (assuming a DailyReportFile model exists or we handle it here)
            foreach ($documentationFiles as $file) {
                $filename = time() . '_' . $studentId . '_' . $file->getClientOriginalName();
                $path = $file->storeAs("daily_reports/{$groupId}", $filename, 'public');
                
                // Assuming DailyReport handles files - check model relationships later
                if (method_exists($report, 'files')) {
                    $report->files()->create(['file_path' => $path]);
                }
            }

            return $report;
        });
    }

    /**
     * Review logbook entry
     */
    public function reviewEntry(
        int $reportId,
        int $reviewerId,
        string $status,
        ?string $reviewNotes = null
    ): DailyReport {
        $report = DailyReport::findOrFail($reportId);

        $report->update([
            'status' => $status,
            'review_notes' => $reviewNotes,
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
        ]);

        return $report->fresh();
    }

    /**
     * Get student's logbook summary
     */
    public function getStudentLogbooks(int $studentId, int $groupId): array
    {
        $reports = DailyReport::where('student_id', $studentId)
            ->where('group_id', $groupId)
            ->orderBy('date', 'desc')
            ->get();

        return [
            'entries' => $reports,
            'statistics' => [
                'total' => $reports->count(),
                'approved' => $reports->where('status', 'approved')->count(),
                'pending' => $reports->where('status', 'submitted')->count(),
                'rejected' => $reports->where('status', 'rejected')->count(),
            ],
        ];
    }
}
