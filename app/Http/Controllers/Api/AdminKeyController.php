<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminKeyController extends Controller
{
    /**
     * Generate a new API key (admin-only, protected by admin secret).
     *
     * POST /api/admin/keys
     * Header: x-admin-secret: <ADMIN_SECRET>
     * Body: { "name": "Project Name", "owner": "email@example.com", "permissions": ["read", "write"] }
     */
    public function store(Request $request): JsonResponse
    {
        // Validate admin secret - use constant-time comparison to prevent timing attacks
        $adminSecret = config('api_keys.admin_secret');

        if (!$adminSecret || !hash_equals($adminSecret, $request->header('x-admin-secret') ?? '')) {
            return response()->json(['error' => 'Unauthorized. Admin secret tidak valid.'], 401);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'owner' => 'required|email|max:255',
            'permissions' => 'sometimes|array',
            'permissions.*' => 'string|in:read,write,delete',
        ]);

        $permissions = $validated['permissions'] ?? ['read'];
        $apiKey = 'sk_' . Str::replace('-', '', Str::uuid()->toString());

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
}