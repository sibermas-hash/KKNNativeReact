<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ApiKeyGenerated;
use App\Models\ApiKey;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class RegistrationController extends Controller
{
    /**
     * Self-service registration — client registers and receives an API key.
     *
     * POST /api/register
     * Body: { "project_name": "My App", "email": "client@email.com", "use_case": "optional" }
     */
    public function register(Request $request): JsonResponse
    {
        if (! config('api_keys.self_service_enabled', false)) {
            return response()->json([
                'error' => 'Registrasi mandiri API key sedang dinonaktifkan. Hubungi admin untuk pengajuan akses.',
            ], 403);
        }

        $validated = $request->validate([
            'project_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'use_case' => 'nullable|string|max:1000',
        ]);

        // Check if email already registered
        $existing = Project::where('email', $validated['email'])->first();
        if ($existing) {
            return response()->json([
                'error' => 'Email sudah terdaftar. Hubungi admin jika butuh key baru.',
            ], 409);
        }

        $apiKey = 'sk_' . Str::replace('-', '', Str::uuid()->toString());

        // Create project
        $project = Project::create([
            'email' => $validated['email'],
            'project_name' => $validated['project_name'],
            'use_case' => $validated['use_case'] ?? null,
        ]);

        // Create API key (default: read-only)
        ApiKey::create([
            'key' => $apiKey,
            'name' => $validated['project_name'],
            'permissions' => ['read'],
            'email' => $validated['email'],
        ]);

        // Send API key via email (best-effort, don't fail the request)
        try {
            $serverUrl = rtrim(config('app.url'), '/');
            Mail::to($validated['email'])->send(
                new ApiKeyGenerated($validated['project_name'], $apiKey, $serverUrl)
            );
        }
        catch (\Throwable $e) {
            // Log but don't fail — key is returned in response as fallback
            logger()->warning('Failed to send API key email', [
                'email' => $validated['email'],
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'message' => 'Registrasi berhasil! API key kamu sudah siap.',
            'api_key' => $apiKey,
            'project_name' => $validated['project_name'],
            'permissions' => ['read'],
        ], 201);
    }
}
