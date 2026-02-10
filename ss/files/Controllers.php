<?php
// app/Http/Controllers/GradingController.php

namespace App\Http\Controllers;

use App\Services\GradingService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GradingController extends Controller
{
    protected $gradingService;

    public function __construct(GradingService $gradingService)
    {
        $this->gradingService = $gradingService;
    }

    /**
     * Display grading interface for DPL
     */
    public function index(Request $request)
    {
        $groupId = $request->user()->dplGroups()->first()->id ?? null;
        
        if (!$groupId) {
            return redirect()->route('dashboard')->with('error', 'No group assigned');
        }

        $summary = $this->gradingService->getGroupGradingSummary($groupId);

        return Inertia::render('Grading/Index', [
            'summary' => $summary,
        ]);
    }

    /**
     * Submit DPL scores
     */
    public function submitDPLScores(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'group_id' => 'required|exists:groups,id',
            'execution_score' => 'required|numeric|min:0|max:100',
            'article_score' => 'required|numeric|min:0|max:100',
        ]);

        $score = $this->gradingService->submitDPLScores(
            $validated['user_id'],
            $validated['group_id'],
            $validated['execution_score'],
            $validated['article_score'],
            $request->user()->id
        );

        return back()->with('success', 'Scores submitted successfully');
    }

    /**
     * Submit Village Head scores
     */
    public function submitVillageScores(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'group_id' => 'required|exists:groups,id',
            'discipline_score' => 'required|numeric|min:0|max:100',
            'attitude_score' => 'required|numeric|min:0|max:100',
        ]);

        $score = $this->gradingService->submitVillageHeadScores(
            $validated['user_id'],
            $validated['group_id'],
            $validated['discipline_score'],
            $validated['attitude_score'],
            $request->user()->id
        );

        return back()->with('success', 'Scores submitted successfully');
    }

    /**
     * Bulk submit DPL scores
     */
    public function bulkSubmitDPLScores(Request $request)
    {
        $validated = $request->validate([
            'scores' => 'required|array',
            'scores.*.user_id' => 'required|exists:users,id',
            'scores.*.group_id' => 'required|exists:groups,id',
            'scores.*.execution_score' => 'required|numeric|min:0|max:100',
            'scores.*.article_score' => 'required|numeric|min:0|max:100',
        ]);

        $results = $this->gradingService->bulkSubmitDPLScores(
            $validated['scores'],
            $request->user()->id
        );

        return back()->with('success', count($results) . ' scores submitted successfully');
    }

    /**
     * Export grades to Excel
     */
    public function export(Request $request)
    {
        $groupId = $request->input('group_id');
        $grades = $this->gradingService->exportGrades($groupId);

        return response()->json($grades);
    }
}

// app/Http/Controllers/LogbookController.php

namespace App\Http\Controllers;

use App\Services\LogbookService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LogbookController extends Controller
{
    protected $logbookService;

    public function __construct(LogbookService $logbookService)
    {
        $this->logbookService = $logbookService;
    }

    /**
     * Display student's logbook entries
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $groupId = $user->groupMember->group_id ?? null;

        if (!$groupId) {
            return redirect()->route('dashboard')->with('error', 'No group assigned');
        }

        $logbooks = $this->logbookService->getStudentLogbooks(
            $user->id,
            $groupId
        );

        return Inertia::render('Logbook/Index', [
            'logbooks' => $logbooks,
        ]);
    }

    /**
     * Show create logbook form
     */
    public function create(Request $request)
    {
        $group = $request->user()->groupMember->group ?? null;

        return Inertia::render('Logbook/Create', [
            'group' => $group,
        ]);
    }

    /**
     * Store new logbook entry
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'activity_date' => 'required|date|before_or_equal:today',
            'village' => 'required|string|max:255',
            'activity_type' => 'required|in:ACC,Tolak,Pending',
            'activity_description' => 'required|string|min:10',
            'documentation.*' => 'image|max:5120', // 5MB
        ]);

        $user = $request->user();
        $groupId = $user->groupMember->group_id;

        $logbook = $this->logbookService->createEntry(
            $user->id,
            $groupId,
            $validated['activity_date'],
            $validated['village'],
            $validated['activity_type'],
            $validated['activity_description'],
            $request->file('documentation', [])
        );

        return redirect()->route('logbook.index')
            ->with('success', 'Logbook entry created successfully');
    }

    /**
     * Update existing logbook entry
     */
    public function update(Request $request, int $id)
    {
        $validated = $request->validate([
            'activity_date' => 'sometimes|date|before_or_equal:today',
            'village' => 'sometimes|string|max:255',
            'activity_type' => 'sometimes|in:ACC,Tolak,Pending',
            'activity_description' => 'sometimes|string|min:10',
            'new_documentation.*' => 'image|max:5120',
        ]);

        $logbook = $this->logbookService->updateEntry(
            $id,
            $request->user()->id,
            $validated
        );

        return back()->with('success', 'Logbook entry updated successfully');
    }

    /**
     * DPL: View pending approvals
     */
    public function pendingApprovals(Request $request)
    {
        $dplId = $request->user()->id;
        $summary = $this->logbookService->getDPLPendingApprovals($dplId);

        return Inertia::render('Logbook/PendingApprovals', [
            'summary' => $summary,
        ]);
    }

    /**
     * DPL: Review logbook entry
     */
    public function review(Request $request, int $id)
    {
        $validated = $request->validate([
            'action' => 'required|in:approved,rejected,revision_required',
            'feedback' => 'nullable|string',
        ]);

        $logbook = $this->logbookService->reviewEntry(
            $id,
            $request->user()->id,
            $validated['action'],
            $validated['feedback'] ?? null
        );

        return back()->with('success', 'Logbook entry reviewed successfully');
    }

    /**
     * DPL: Bulk approve entries
     */
    public function bulkApprove(Request $request)
    {
        $validated = $request->validate([
            'logbook_ids' => 'required|array',
            'logbook_ids.*' => 'required|exists:logbooks,id',
        ]);

        $results = $this->logbookService->bulkApprove(
            $validated['logbook_ids'],
            $request->user()->id
        );

        return back()->with('success', count($results) . ' entries approved successfully');
    }

    /**
     * Delete logbook entry
     */
    public function destroy(Request $request, int $id)
    {
        $this->logbookService->deleteEntry($id, $request->user()->id);

        return back()->with('success', 'Logbook entry deleted successfully');
    }
}

// app/Http/Controllers/ReportController.php

namespace App\Http\Controllers;

use App\Services\ReportManagementService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    protected $reportService;

    public function __construct(ReportManagementService $reportService)
    {
        $this->reportService = $reportService;
    }

    /**
     * Display student's report progress
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $groupId = $user->groupMember->group_id ?? null;

        if (!$groupId) {
            return redirect()->route('dashboard')->with('error', 'No group assigned');
        }

        $progress = $this->reportService->getStudentReportProgress($user->id, $groupId);

        return Inertia::render('Reports/Index', [
            'progress' => $progress,
        ]);
    }

    /**
     * Upload a new report
     */
    public function upload(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'required|file|max:10240', // 10MB default
        ]);

        $user = $request->user();
        $groupId = $user->groupMember->group_id;

        $report = $this->reportService->uploadReport(
            $user->id,
            $groupId,
            $validated['type'],
            $request->file('file'),
            $validated['title'],
            $validated['description'] ?? null
        );

        return back()->with('success', 'Report uploaded successfully');
    }

    /**
     * Submit report for review
     */
    public function submit(Request $request, int $id)
    {
        $report = $this->reportService->submitForReview($id, $request->user()->id);

        return back()->with('success', 'Report submitted for review');
    }

    /**
     * DPL: Review a report
     */
    public function review(Request $request, int $id)
    {
        $validated = $request->validate([
            'action' => 'required|in:approved,rejected,revision_required',
            'feedback' => 'nullable|string',
        ]);

        $report = $this->reportService->reviewReport(
            $id,
            $request->user()->id,
            $validated['action'],
            $validated['feedback'] ?? null
        );

        return back()->with('success', 'Report reviewed successfully');
    }

    /**
     * Download report
     */
    public function download(Request $request, int $id)
    {
        $url = $this->reportService->getDownloadUrl($id, $request->user()->id);

        return redirect($url);
    }
}

// app/Http/Controllers/WorkshopController.php

namespace App\Http\Controllers;

use App\Services\WorkshopService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WorkshopController extends Controller
{
    protected $workshopService;

    public function __construct(WorkshopService $workshopService)
    {
        $this->workshopService = $workshopService;
    }

    /**
     * Display upcoming workshops
     */
    public function index()
    {
        $workshops = $this->workshopService->getUpcomingWorkshops();

        return Inertia::render('Workshops/Index', [
            'workshops' => $workshops,
        ]);
    }

    /**
     * Register for a workshop
     */
    public function register(Request $request, int $workshopId)
    {
        $participant = $this->workshopService->registerParticipant(
            $workshopId,
            $request->user()->id
        );

        return back()->with('success', 'Registered successfully');
    }

    /**
     * Admin: Mark attendance
     */
    public function markAttendance(Request $request, int $workshopId)
    {
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'required|exists:users,id',
        ]);

        $results = $this->workshopService->bulkMarkAttendance(
            $workshopId,
            $validated['user_ids']
        );

        return back()->with('success', 'Attendance marked and certificates generated');
    }

    /**
     * Download certificate
     */
    public function downloadCertificate(Request $request, int $participantId)
    {
        $url = $this->workshopService->getCertificateDownloadUrl(
            $participantId,
            $request->user()->id
        );

        return redirect($url);
    }
}
