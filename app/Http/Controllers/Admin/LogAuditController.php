<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\LogAudit;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LogAuditController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', LogAudit::class);

        $query = LogAudit::with('user:id,name,email')
            ->when($request->action, fn($q, $v) => $q->where('action', $v))
            ->when($request->user_id, fn($q, $v) => $q->where('user_id', $v))
            ->when($request->date_from, fn($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($request->date_to, fn($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->when($request->search, fn($q, $v) => $q->where(function($q) use ($v) {
                $q->where('description', 'like', "%{$v}%")
                  ->orWhere('ip_address', 'like', "%{$v}%")
                  ->orWhereHas('user', fn($q) => $q->where('name', 'like', "%{$v}%"));
            }));

        $logs = $query->latest()
            ->paginate(50)
            ->withQueryString();

        // Stats untuk header
        $stats = [
            'total_today' => LogAudit::whereDate('created_at', today())->count(),
            'gate_bypass' => LogAudit::where('action', 'GATE_BYPASS')
                                ->whereDate('created_at', today())->count(),
            'actors_today' => LogAudit::whereDate('created_at', today())
                                ->distinct('user_id')->count(),
        ];

        return Inertia::render('Admin/AuditLog/Index', [
            'logs' => $logs,
            'stats' => $stats,
            'filters' => $request->only(['action', 'user_id', 'date_from', 'date_to', 'search']),
            'actions' => LogAudit::distinct('action')->pluck('action'),
            'users' => User::whereHas('roles', fn($q) => $q->whereIn('name', ['admin', 'dpl']))->select('id', 'name')->get(),
        ]);
    }

    public function show(LogAudit $auditLog)
    {
        $this->authorize('view', $auditLog);

        return Inertia::render('Admin/AuditLog/Show', [
            'log' => $auditLog->load('user:id,name,email'),
        ]);
    }
}
