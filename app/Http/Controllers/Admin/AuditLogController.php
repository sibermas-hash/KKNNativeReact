<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', AuditLog::class);

        $query = AuditLog::with('user:id,name,email')
            ->when($request->action, fn($q, $v) => $q->where('action', $v))
            ->when($request->user_id, fn($q, $v) => $q->where('user_id', $v))
            ->when($request->date_from, fn($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($request->date_to, fn($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->when($request->search, fn($q, $v) => $q->where(function($q) use ($v) {
                $q->where('ability', 'like', "%{$v}%")
                  ->orWhere('ip_address', 'like', "%{$v}%")
                  ->orWhereHas('user', fn($q) => $q->where('name', 'like', "%{$v}%"));
            }));

        $logs = $query->latest()
            ->paginate(50)
            ->withQueryString();

        // Stats untuk header
        $stats = [
            'total_today' => AuditLog::whereDate('created_at', today())->count(),
            'gate_bypass' => AuditLog::where('action', 'GATE_BYPASS')
                                ->whereDate('created_at', today())->count(),
            'actors_today' => AuditLog::whereDate('created_at', today())
                                ->distinct('user_id')->count(),
        ];

        return Inertia::render('Admin/AuditLog/Index', [
            'logs' => $logs,
            'stats' => $stats,
            'filters' => $request->only(['action', 'user_id', 'date_from', 'date_to', 'search']),
            'actions' => AuditLog::distinct('action')->pluck('action'),
            'users' => User::whereHas('roles', fn($q) => $q->whereIn('name', ['admin', 'dpl']))->select('id', 'name')->get(),
        ]);
    }

    public function show(AuditLog $auditLog)
    {
        $this->authorize('view', $auditLog);

        return Inertia::render('Admin/AuditLog/Show', [
            'log' => $auditLog->load('user:id,name,email'),
        ]);
    }
}
