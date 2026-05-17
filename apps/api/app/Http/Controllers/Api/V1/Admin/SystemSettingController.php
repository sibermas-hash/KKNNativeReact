<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Jobs\ResetPendaftaranJob;
use App\Models\KKN\SystemSetting;
use App\Services\AI\HasAiFailover;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SystemSettingController extends Controller
{
    use ApiResponse;
    use HasAiFailover;

    public function index(): JsonResponse
    {
        return $this->success(['settings' => SystemSetting::pluck('value', 'config_key')]);
    }

    public function update(Request $request): JsonResponse
    {
        foreach ($request->validate(['settings' => ['required', 'array']])['settings'] as $key => $value) {
            SystemSetting::set($key, $value);
        }

        return $this->noContent('Pengaturan berhasil diperbarui.');
    }

    public function getAiConfig(): JsonResponse
    {
        $provider = (string) config('ai.default', 'rizquna');
        $providerKey = data_get(config('ai.providers'), "{$provider}.key");
        $tiers = $this->loadAiTierMap();
        $effectiveModel = (string) SystemSetting::get(
            'ai_assistant_model',
            SystemSetting::get('ai_model', config('ai.routing.assistant.model', 'ag/gemini-3-flash'))
        );
        $hasApiKey = is_string($providerKey) && trim($providerKey) !== '';

        if (! $hasApiKey) {
            foreach ($tiers as $tier) {
                if (! empty($tier['key'])) {
                    $hasApiKey = true;
                    break;
                }
            }
        }

        return $this->success([
            'provider' => $provider,
            'has_api_key' => $hasApiKey,
            'model' => $effectiveModel,
        ]);
    }

    public function testAiConnection(): JsonResponse
    {
        $preferredModel = (string) SystemSetting::get(
            'ai_assistant_model',
            SystemSetting::get('ai_model', config('ai.routing.assistant.model', 'ag/gemini-3-flash'))
        );
        $tiers = $this->loadAiTiers($preferredModel, true);
        $lastError = null;

        foreach ($tiers as $tier) {
            if (empty($tier['key'])) {
                continue;
            }

            try {
                $response = Http::withToken($tier['key'])
                    ->timeout((int) config('ai.routing.assistant.timeout', 15))
                    ->post(rtrim($tier['url'], '/').'/chat/completions', [
                        'model' => $tier['model'],
                        'stream' => false,
                        'messages' => [
                            ['role' => 'system', 'content' => 'Balas tepat dengan kata pong.'],
                            ['role' => 'user', 'content' => 'ping'],
                        ],
                        'temperature' => 0,
                        'max_tokens' => 4,
                    ]);

                if (! $response->successful()) {
                    $lastError = "HTTP {$response->status()}: ".mb_substr($response->body(), 0, 200);
                    continue;
                }

                $content = trim((string) $response->json('choices.0.message.content', ''));
                if ($content === '') {
                    $lastError = 'AI merespons tanpa konten.';
                    continue;
                }

                return $this->success([
                    'connected' => true,
                    'tier_used' => str_replace('-gateway', '', $tier['label']),
                    'model_used' => $tier['model'],
                ], 'Koneksi AI berhasil.');
            } catch (\Throwable $e) {
                $lastError = $e->getMessage();
                Log::warning('AI connection test failed', [
                    'tier' => $tier['label'],
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($lastError === null) {
            return $this->error('AI_UNAVAILABLE', 'Tidak ada API key AI yang terkonfigurasi.', 503);
        }

        return $this->error('AI_CONNECTION_FAILED', 'Koneksi AI gagal: '.$lastError, 502);
    }

    public function updateAiSettings(Request $request): JsonResponse
    {
        foreach ($request->only(['ai_provider', 'rizquna_api_key', 'rizquna_url', 'ai_model']) as $key => $value) {
            if ($value !== null) {
                SystemSetting::set($key, $value);
            }
        }

        return $this->noContent('Pengaturan AI berhasil diperbarui.');
    }

    public function removeAiKey(): JsonResponse
    {
        foreach (['rizquna_api_key', 'ai_primary_key', 'ai_fallback_key', 'ai_tertiary_key'] as $key) {
            SystemSetting::set($key, null);
        }

        return $this->noContent('API key AI berhasil dihapus.');
    }

    public function resetPendaftaran(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'confirmation' => ['required', 'string', 'in:HAPUS SEMUA DATA PENDAFTARAN'],
            'soft' => ['sometimes', 'boolean'],
        ]);

        $user = $request->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        try {
            // Preserve current access token supaya operator tidak force-logout
            // saat job memanggil `pendaftaran:reset` yang truncate tokens.
            $currentToken = $user->currentAccessToken();
            $keepTokenId = $currentToken !== null && isset($currentToken->id) ? (int) $currentToken->id : null;

            // Audit log SEBELUM dispatch — trail tetap tercatat walau job gagal.
            AuditService::log(
                'RESET_PENDAFTARAN_INITIATED',
                'Reset pendaftaran di-initiate dari admin panel ('.($validated['soft'] ?? false ? 'soft' : 'full').')',
                null,
                null,
                [
                    'mode' => $validated['soft'] ?? false ? 'soft' : 'full',
                    'keep_token_id' => $keepTokenId,
                ],
                (int) $user->id
            );

            // Dispatch ke queue 'long' — response cepat, kerja berat di background.
            ResetPendaftaranJob::dispatch(
                (int) $user->id,
                $keepTokenId,
                (bool) ($validated['soft'] ?? false),
            );

            return $this->success(
                [
                    'status' => 'queued',
                    'message' => 'Reset sedang diproses di background. Cek log audit untuk konfirmasi.',
                ],
                'Reset pendaftaran dijadwalkan.',
                202
            );
        } catch (\Throwable $e) {
            Log::error('resetPendaftaran dispatch failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return $this->serverError('Gagal menjadwalkan reset: '.$e->getMessage());
        }
    }
}
