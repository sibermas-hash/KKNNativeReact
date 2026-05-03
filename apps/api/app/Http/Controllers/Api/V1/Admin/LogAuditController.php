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

    public function index(Request $request): JsonResponse
    {
        $query = LogAudit::with('user')->when($request->input('search'), fn ($q, $s) => $q->where('action', 'like', "%{$s}%"))->orderByDesc('created_at');
        return $this->successCollection(LogAuditResource::collection($query->paginate(25)));
    }

    public function show(LogAudit $auditLog): JsonResponse
    {
        $auditLog->load('user');
        return $this->success(new LogAuditResource($auditLog));
    }
}
