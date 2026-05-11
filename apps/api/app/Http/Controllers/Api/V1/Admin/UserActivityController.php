<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\UserActivityLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * UserActivityController — admin endpoint untuk PRD_USER_ACTIVITY_LOG.md.
 *
 *   GET /admin/activity-log         → paginated list with filters
 *   GET /admin/activity-log/stats   → aggregate dashboard stats (cached 60s)
 *   GET /admin/activity-log/user/{id} → user history
 */
class UserActivityController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'action' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'in:success,failed'],
            'ip' => ['nullable', 'string', 'max:45'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        $query = UserActivityLog::query()->with('user:id,name,username,email');

        if (! empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }
        if (! empty($filters['action'])) {
            $query->where('action', $filters['action']);
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['ip'])) {
            $query->where('ip_address', $filters['ip']);
        }
        if (! empty($filters['date_from'])) {
            // Gunakan range comparison, bukan whereDate() yang bypass B-tree index.
            $query->where('created_at', '>=', Carbon::parse($filters['date_from'])->startOfDay());
        }
        if (! empty($filters['date_to'])) {
            $query->where('created_at', '<=', Carbon::parse($filters['date_to'])->endOfDay());
        }

        $perPage = (int) ($filters['per_page'] ?? 25);
        $logs = $query->orderByDesc('created_at')->paginate($perPage);

        $logs->getCollection()->transform(function (UserActivityLog $log) {
            return [
                'id' => $log->id,
                'user' => $log->user ? [
                    'id' => $log->user->id,
                    'name' => $log->user->name,
                    'username' => $log->user->username,
                ] : null,
                'action' => $log->action,
                'status' => $log->status,
                'metadata' => $log->metadata,
                'ip_address' => $log->ip_address,
                'user_agent' => $log->user_agent,
                'created_at' => $log->created_at?->toIso8601String(),
            ];
        });

        return $this->success([
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $cacheKey = 'admin:activity-stats:v1';

        $stats = Cache::remember($cacheKey, 60, function () {
            return $this->computeStats();
        });

        return $this->success($stats);
    }

    public function userHistory(User $user, Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 25);
        $logs = UserActivityLog::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate(min($perPage, 100));

        return $this->success([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
            ],
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function computeStats(): array
    {
        $today = now()->startOfDay();
        $weekAgo = now()->subDays(7);
        $monthAgo = now()->subDays(30);

        $loginStats = [
            'total_attempts_today' => UserActivityLog::where('action', 'login')->where('created_at', '>=', $today)->count(),
            'successful_today' => UserActivityLog::where('action', 'login')->where('status', 'success')->where('created_at', '>=', $today)->count(),
            'failed_today' => UserActivityLog::where('action', 'login')->where('status', 'failed')->where('created_at', '>=', $today)->count(),
            'unique_users_today' => (int) UserActivityLog::where('action', 'login')->where('status', 'success')->where('created_at', '>=', $today)->distinct('user_id')->count('user_id'),
            'unique_users_week' => (int) UserActivityLog::where('action', 'login')->where('status', 'success')->where('created_at', '>=', $weekAgo)->distinct('user_id')->count('user_id'),
            'unique_users_month' => (int) UserActivityLog::where('action', 'login')->where('status', 'success')->where('created_at', '>=', $monthAgo)->distinct('user_id')->count('user_id'),
        ];

        // Aggregate per role
        $byRole = DB::table('users')
            ->leftJoin('model_has_roles', function ($j) {
                $j->on('users.id', '=', 'model_has_roles.model_id')
                    ->where('model_has_roles.model_type', '=', User::class);
            })
            ->leftJoin('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->select('roles.name as role', DB::raw('COUNT(DISTINCT users.id) as total'))
            ->where('users.is_active', true)
            ->groupBy('roles.name')
            ->pluck('total', 'role')->toArray();

        $loggedInPerRole = DB::table('user_activity_logs')
            ->join('model_has_roles', function ($j) {
                $j->on('user_activity_logs.user_id', '=', 'model_has_roles.model_id')
                    ->where('model_has_roles.model_type', '=', User::class);
            })
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('user_activity_logs.action', 'login')
            ->where('user_activity_logs.status', 'success')
            ->select('roles.name as role', DB::raw('COUNT(DISTINCT user_activity_logs.user_id) as logged_in'))
            ->groupBy('roles.name')
            ->pluck('logged_in', 'role')->toArray();

        $rolesOutput = [];
        foreach (['student', 'dosen', 'dpl', 'admin', 'faculty_admin', 'superadmin'] as $role) {
            $total = (int) ($byRole[$role] ?? 0);
            $loggedIn = (int) ($loggedInPerRole[$role] ?? 0);
            $rolesOutput[$role] = [
                'total' => $total,
                'logged_in' => $loggedIn,
                'never_logged_in' => max(0, $total - $loggedIn),
                'percent' => $total > 0 ? round(($loggedIn / $total) * 100, 1) : 0.0,
            ];
        }

        $passwordStats = [
            'changed_today' => UserActivityLog::where('action', 'password_change')->where('status', 'success')->where('created_at', '>=', $today)->count(),
            'changed_this_week' => UserActivityLog::where('action', 'password_change')->where('status', 'success')->where('created_at', '>=', $weekAgo)->count(),
        ];

        $profileStats = [
            'updated_today' => UserActivityLog::where('action', 'profile_update')->where('created_at', '>=', $today)->count(),
            'avatar_uploaded_today' => UserActivityLog::where('action', 'avatar_upload')->where('created_at', '>=', $today)->count(),
            'avatar_rejected_today' => UserActivityLog::where('action', 'avatar_rejected')->where('created_at', '>=', $today)->count(),
        ];

        // Brute-force suspects: IPs with 5+ failed logins today
        $suspiciousIps = UserActivityLog::where('action', 'login')
            ->where('status', 'failed')
            ->where('created_at', '>=', $today)
            ->select('ip_address', DB::raw('COUNT(*) as attempts'), DB::raw('MAX(created_at) as last_attempt'))
            ->whereNotNull('ip_address')
            ->groupBy('ip_address')
            ->having('attempts', '>=', 5)
            ->orderByDesc('attempts')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'ip' => $r->ip_address,
                'attempts' => (int) $r->attempts,
                'last_attempt' => (string) $r->last_attempt,
            ])
            ->all();

        // Recent activity (last 10)
        $recent = UserActivityLog::with('user:id,name,username')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(function (UserActivityLog $log) {
                return [
                    'user' => $log->user?->name ?? 'Unknown',
                    'username' => $log->user?->username,
                    'action' => $log->action,
                    'status' => $log->status,
                    'ip' => $log->ip_address,
                    'time' => $log->created_at?->toIso8601String(),
                ];
            })
            ->all();

        return [
            'login' => $loginStats,
            'by_role' => $rolesOutput,
            'password' => $passwordStats,
            'profile' => $profileStats,
            'suspicious' => [
                'repeated_failures' => $suspiciousIps,
                'suspect_ip_count_today' => count($suspiciousIps),
            ],
            'recent_activity' => $recent,
            'generated_at' => now()->toIso8601String(),
        ];
    }
}
