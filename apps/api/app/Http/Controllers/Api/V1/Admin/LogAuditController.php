<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\LogAuditResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\LogAudit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LogAuditController extends Controller
{
    use ApiResponse;

    /**
     * GET /admin/audit-log
     *
     * Supported filters (all optional, all AND-combined):
     *   user_id       : int    — filter by actor
     *   action        : string — LIKE match on the action verb (e.g. CREATE)
     *   model_type    : string — either FQCN (App\\Models\\KKN\\Mahasiswa)
     *                            or class basename (Mahasiswa) — basename
     *                            match uses LIKE '%ClassName' so it works
     *                            regardless of namespace.
     *   severity      : string — low | medium | high
     *   date_from     : date (Y-m-d or ISO8601) — inclusive
     *   date_to       : date — inclusive (end-of-day)
     *   search        : string — legacy, alias for `action`
     *   per_page      : int 10..100 (default 25)
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id'    => ['nullable', 'integer', 'exists:users,id'],
            'action'     => ['nullable', 'string', 'max:100'],
            'search'     => ['nullable', 'string', 'max:100'],
            'model_type' => ['nullable', 'string', 'max:255'],
            'severity'   => ['nullable', 'in:low,medium,high'],
            'date_from'  => ['nullable', 'date'],
            'date_to'    => ['nullable', 'date'],
            'per_page'   => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        $perPage = (int) ($validated['per_page'] ?? 25);
        $action  = $validated['action'] ?? $validated['search'] ?? null;

        $query = LogAudit::with('user')
            ->when($validated['user_id'] ?? null, fn ($q, $userId) => $q->where('user_id', $userId))
            ->when($action, fn ($q, $a) => $q->where('action', 'like', "%{$a}%"))
            ->when($validated['model_type'] ?? null, function ($q, $modelType) {
                // Accept FQCN or class basename — basename match via LIKE so
                // the admin UI can pass a friendly name like "Mahasiswa".
                if (str_contains($modelType, '\\')) {
                    return $q->where('model_type', $modelType);
                }
                return $q->where('model_type', 'like', '%'.str_replace('%', '\\%', $modelType));
            })
            ->when($validated['severity'] ?? null, fn ($q, $s) => $q->where('severity', $s))
            ->when($validated['date_from'] ?? null, fn ($q, $d) => $q->where('created_at', '>=', $d))
            ->when($validated['date_to'] ?? null, function ($q, $d) {
                // Inclusive of end day — so date_to=2026-05-10 catches events
                // all the way up to 23:59:59 on that date.
                return $q->where('created_at', '<=', \Carbon\Carbon::parse($d)->endOfDay());
            })
            ->orderByDesc('created_at');

        return $this->successCollection(
            LogAuditResource::collection($query->paginate($perPage))
        );
    }

    public function show(LogAudit $auditLog): JsonResponse
    {
        $auditLog->load('user');
        return $this->success(new LogAuditResource($auditLog));
    }
}
