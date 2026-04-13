<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\LogAudit;
use App\Models\User;
use App\Traits\HandlesPagination;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LogAuditController extends Controller
{
    use HandlesPagination;

    public function index(Request $request)
    {
        $this->authorize('viewAny', LogAudit::class);

        $query = LogAudit::with('user:id,name,email')
            ->when($request->action, fn ($q, $v) => $q->where('action', $v))
            ->when($request->user_id, fn ($q, $v) => $q->where('user_id', $v))
            ->when($request->date_from, fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($request->date_to, fn ($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->when($request->search, fn ($q, $v) => $q->where(function ($q) use ($v) {
                $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $v);
                $q->where('description', 'like', "%{$escaped}%")
                    ->orWhere('ip_address', 'like', "%{$escaped}%");

                // VULN-014 Fix: Cross-database search for user name
                $userIds = \App\Models\User::where('name', 'like', "%{$escaped}%")->pluck('id');
                if ($userIds->isNotEmpty()) {
                    $q->orWhereIn('user_id', $userIds);
                }
            }));

        $logs = $query->latest()
            ->paginate(50)
            ->withQueryString();

        // Stats untuk header & cards
        $stats = [
            'total' => LogAudit::count(),
            'high_risk' => LogAudit::where('severity', 'high')->count(),
            'unique_users' => LogAudit::distinct('user_id')->count('user_id'),
            'today_logs' => LogAudit::whereDate('created_at', today())->count(),
        ];

        return Inertia::render('Admin/Monitoring/AuditLog/Index', [
            'logs' => $this->formatPaginator($logs),
            'stats' => $stats,
            'filters' => $request->only(['action', 'user_id', 'date_from', 'date_to', 'search']),
            'actions' => LogAudit::distinct('action')->pluck('action'),
            'users' => User::whereHas('roles', fn ($q) => $q->whereIn('name', ['superadmin', 'faculty_admin', 'dpl']))
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function show(LogAudit $auditLog)
    {
        $this->authorize('view', $auditLog);

        return Inertia::render('Admin/Monitoring/AuditLog/Show', [
            'log' => $auditLog->load('user:id,name,email'),
        ]);
    }
}
