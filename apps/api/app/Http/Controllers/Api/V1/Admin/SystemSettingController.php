<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\SystemSetting;
use App\Services\AI\HasAiFailover;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

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

    public function aiHealth(): JsonResponse
    {
        $preferredModel = (string) SystemSetting::get(
            'ai_assistant_model',
            SystemSetting::get('ai_model', config('ai.routing.assistant.model', 'ag/gemini-3-flash'))
        );
        $tiers = $this->loadAiTiers($preferredModel, true);
        $issues = [];
        $configured = 0;

        foreach ($tiers as $tier) {
            $hasKey = is_string($tier['key'] ?? null) && trim((string) $tier['key']) !== '';
            if ($hasKey) {
                $configured++;
            } else {
                $issues[] = "Tier {$tier['label']} belum punya API key.";
                continue;
            }

            if (! Str::startsWith((string) ($tier['url'] ?? ''), ['http://', 'https://'])) {
                $issues[] = "Tier {$tier['label']} URL tidak valid.";
            }
        }

        return response()->json([
            'ok' => $configured > 0 && $issues === [],
            'message' => $configured > 0
                ? ($issues === [] ? 'Konfigurasi AI tersedia.' : 'Konfigurasi AI tersedia, namun ada catatan.')
                : 'Tidak ada API key AI yang terkonfigurasi.',
            'issues' => $issues,
            'checked_at' => now()->toIso8601String(),
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
}
