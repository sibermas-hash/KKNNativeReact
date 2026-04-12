<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminKeyController extends Controller
{
    private function hasValidAdminSecret(Request $request): bool
    {
        $adminSecret = config('api_keys.admin_secret');

        // SECURITY: If admin_secret is not configured, reject all requests
        if (! $adminSecret || trim($adminSecret) === '') {
            \Illuminate\Support\Facades\Log::warning('Admin secret not configured', [
                'ip' => $request->ip(),
            ]);

            return false;
        }

        // Get the provided secret, default to empty string
        $providedSecret = $request->header('x-admin-secret') ?? '';

        // SECURITY: Reject empty provided secrets
        if ($providedSecret === '') {
            return false;
        }

        return hash_equals($adminSecret, $providedSecret);
    }

    /**
     * Generate a new API key (admin-only, protected by admin secret).
     *
     * POST /api/admin/keys
     * Header: x-admin-secret: <ADMIN_SECRET>
     * Body: { "name": "Project Name", "owner": "email@example.com", "permissions": ["read", "write"] }
     */
    public function store(Request $request): JsonResponse
    {
        if (! $this->hasValidAdminSecret($request)) {
            return response()->json(['error' => 'Unauthorized. Admin secret tidak valid.'], 401);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'owner' => 'required|email|max:255',
            'permissions' => 'sometimes|array',
            'permissions.*' => 'string|in:read,write,delete',
        ]);

        $permissions = $validated['permissions'] ?? ['read'];
        $apiKey = 'sk_'.Str::replace('-', '', Str::uuid()->toString());

        // Create or update project
        $project = Project::updateOrCreate(
            ['email' => $validated['owner']],
            ['project_name' => $validated['name']]
        );

        // Create API key
        $keyModel = ApiKey::create([
            'key' => $apiKey,
            'name' => $validated['name'],
            'permissions' => $permissions,
            'email' => $validated['owner'],
        ]);

        return response()->json([
            'message' => 'API key berhasil dibuat.',
            'api_key' => $apiKey,
            'name' => $validated['name'],
            'permissions' => $permissions,
            'project_id' => $project->id,
        ], 201);
    }

    public function revoke(Request $request, ApiKey $apiKey): JsonResponse
    {
        if (! $this->hasValidAdminSecret($request)) {
            return response()->json(['error' => 'Unauthorized. Admin secret tidak valid.'], 401);
        }

        $apiKey->update(['is_active' => false]);

        return response()->json([
            'message' => 'API key berhasil dinonaktifkan.',
        ]);
    }
}
