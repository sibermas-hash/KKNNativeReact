<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ApiKeyGenerated;
use App\Models\ApiKey;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AdminKeyController extends Controller
{
    private function hasValidAdminSecret(Request $request): bool
    {
        $adminSecret = config('api_keys.admin_secret');

        // SECURITY: If admin_secret is not configured, reject all requests
        if (! $adminSecret || trim($adminSecret) === '') {
            Log::warning('Admin secret not configured', [
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
            'expires_in_days' => 'sometimes|integer|min:1|max:365',
        ]);

        $permissions = $validated['permissions'] ?? ['read'];
        $expiresAt = isset($validated['expires_in_days'])
            ? now()->addDays((int) $validated['expires_in_days'])
            : null;
        $apiKey = 'sk_'.Str::replace('-', '', Str::uuid()->toString());

        // X-001 fix (audit follow-up): was echoing the plaintext API key in
        // the response body — same H-013 pattern we already fixed on the
        // self-service endpoint, missed here. Now the key is ONLY delivered
        // via email and the whole thing is transactional so mail failure
        // rolls back the project + key creation (mirrors RegistrationController).
        try {
            DB::transaction(function () use ($validated, $permissions, $apiKey, $expiresAt) {
                $project = Project::updateOrCreate(
                    ['email' => $validated['owner']],
                    ['project_name' => $validated['name']]
                );

                // Wipe any prior inactive keys for this owner (idempotent retry).
                ApiKey::where('email', $validated['owner'])
                    ->where('is_active', false)
                    ->delete();

                // Create inactive, then activate after mail success. We keep a
                // reference to the model so we can flip `is_active` without
                // querying by hashed value (which would require rehashing).
                $record = ApiKey::create([
                    'key' => $apiKey,
                    'name' => $validated['name'],
                    'permissions' => $permissions,
                    'email' => $validated['owner'],
                    'is_active' => false,
                    'expires_at' => $expiresAt,
                ]);

                $serverUrl = rtrim(config('app.url'), '/');
                Mail::to($validated['owner'])->send(
                    new ApiKeyGenerated($validated['name'], $apiKey, $serverUrl)
                );

                $record->update(['is_active' => true]);
            });
        } catch (\Throwable $e) {
            Log::warning('Admin API key generation failed', [
                'owner' => $validated['owner'],
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Gagal mengirim API key ke email pemilik. Silakan coba lagi atau cek log.',
            ], 502);
        }

        return response()->json([
            'message' => 'API key berhasil dibuat dan dikirim ke email pemilik.',
            'name' => $validated['name'],
            'permissions' => $permissions,
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
