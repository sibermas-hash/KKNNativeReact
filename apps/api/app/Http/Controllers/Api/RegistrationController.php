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

        // Check if email already has an ACTIVE key. R-002 fix: previously this
        // blocked any email with an existing project row, which made retry
        // after mail failure impossible (because a dead inactive key was
        // lingering). Now only active keys block re-registration.
        $existing = Project::where('email', $validated['email'])
            ->whereHas('apiKeys', fn ($q) => $q->where('is_active', true))
            ->first();
        if ($existing) {
            return response()->json([
                'error' => 'Email sudah terdaftar. Hubungi admin jika butuh key baru.',
            ], 409);
        }

        $apiKey = 'sk_'.Str::replace('-', '', Str::uuid()->toString());

        // R-002 fix: wrap the whole thing in a transaction. If mail fails we
        // roll back BOTH the Project and the ApiKey rows so the caller can
        // retry. Previously we'd leave orphans and the caller was locked out.
        try {
            DB::transaction(function () use ($validated, $apiKey) {
                // Idempotent project creation — reuse an existing inactive
                // project row if one exists (from a prior failed attempt)
                // instead of inserting a duplicate.
                $project = Project::updateOrCreate(
                    ['email' => $validated['email']],
                    [
                        'project_name' => $validated['project_name'],
                        'use_case' => $validated['use_case'] ?? null,
                    ]
                );

                // Wipe any prior inactive keys for this email.
                ApiKey::where('email', $validated['email'])
                    ->where('is_active', false)
                    ->delete();

                $record = ApiKey::create([
                    'key' => $apiKey,
                    'name' => $validated['project_name'],
                    'permissions' => ['read'],
                    'email' => $validated['email'],
                    'is_active' => false,
                ]);

                $serverUrl = rtrim(config('app.url'), '/');
                Mail::to($validated['email'])->send(
                    new ApiKeyGenerated($validated['project_name'], $apiKey, $serverUrl)
                );

                // Mail dispatched — activate the key. If Mail::send threw
                // above, the transaction rolls back and the key never exists.
                // We use the model instance rather than a WHERE-by-value query
                // because `key` is now hashed; looking up by plaintext would fail.
                $record->update(['is_active' => true]);
            });
        } catch (\Throwable $e) {
            logger()->warning('Self-service registration failed', [
                'email' => $validated['email'],
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Gagal mengirim API key ke email. Silakan coba lagi atau hubungi admin.',
            ], 502);
        }

        // H-013 fix: NEVER return the plaintext key in the response body.
        // It is only sent via email to prove control of the address.
        return response()->json([
            'message' => 'Registrasi berhasil. API key telah dikirim ke email Anda.',
            'project_name' => $validated['project_name'],
            'permissions' => ['read'],
        ], 201);
    }
}
