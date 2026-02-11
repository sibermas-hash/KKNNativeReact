<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DailyReport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DailyReportController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->input('status');

        $reports = DailyReport::with(['student', 'group'])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->orderByDesc('date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/DailyReports/Index', [
            'reports' => $reports,
            'filters' => $request->only('status'),
        ]);
    }
}
