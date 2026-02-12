<?php

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
     * Display reports management
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // For Admin, show global reports summary
        if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
            $summary = [
                'total_reports' => \App\Models\Report::count(),
                'pending_review' => \App\Models\Report::where('status', 'submitted')->count(),
            ];
            
            return Inertia::render('Admin/Reports/Index', [
                'summary' => $summary,
                'reports' => \App\Models\Report::with(['user', 'group'])->latest()->paginate(10),
            ]);
        }

        // For Student, show their progress
        $groupId = $user->getActiveGroupId();
        
        if ($groupId) {
            $progress = $this->reportService->getStudentReportProgress($user->id, $groupId);
            return Inertia::render('Student/Reports/Index', [
                'progress' => $progress,
            ]);
        }

        return redirect()->route('dashboard')->with('error', 'Belum memiliki kelompok.');
    }

    /**
     * Upload a report
     */
    public function upload(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string',
            'title' => 'required|string|max:255',
            'file' => 'required|file|max:512000|mimes:pdf,docx,png,jpg,jpeg,mp4,avi,mov,xlsx', // 500MB max, restricted MIME types
        ]);

        $user = $request->user();
        $groupId = $user->getActiveGroupId();

        if (!$groupId) {
             return back()->with('error', 'Kelompok tidak ditemukan.');
        }

        $this->reportService->uploadReport(
            $user->id,
            $groupId,
            $validated['type'],
            $request->file('file'),
            $validated['title']
        );

        return back()->with('success', 'Laporan berhasil diunggah.');
    }
}
