<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\SystemSetting;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Memvalidasi foto profil menggunakan AI Vision Rizquna (Graceful Degradation 4 Lapis).
 *
 * Failover strategy — tetap di Rizquna Router:
 *   1. Primary        (AI_PRIMARY_KEY / gateway)
 *   2. Fallback       (AI_FALLBACK_KEY / gateway)
 *   3. Tertiary       (AI_TERTIARY_KEY / gateway)
 *
 * Urutan percobaan: Primary → Fallback → Tertiary → manual review.
 * Jika seluruh tier gagal / quota habis,
 * foto tetap tersimpan dengan flag `requires_manual_review=true` untuk
 * Layer 4 (Human-in-the-Loop).
 */
class AvatarValidationService
{
    /**
     * @return array{is_valid: bool, reason: string|null, requires_manual_review: bool}
     */
    public function validateAvatar(string $imagePath): array
    {
        $absolutePath = storage_path('app/public/'.$imagePath);

        if (! file_exists($absolutePath)) {
            return ['is_valid' => false, 'reason' => 'File tidak ditemukan.', 'requires_manual_review' => false];
        }

        $base64Image = base64_encode(file_get_contents($absolutePath));
        $mimeType = mime_content_type($absolutePath);
        $payload = $this->buildPayload($base64Image, $mimeType);

        $tiers = $this->loadTiers();

        foreach ($tiers as $index => $tier) {
            if (empty($tier['key'])) {
                Log::info("Avatar validation tier {$tier['label']} skipped: no API key configured");

                continue;
            }

            try {
                $result = $this->callOpenAICompatibleApi($tier['url'], $tier['key'], $tier['model'], $payload);
                Log::info("Avatar validation succeeded on tier {$tier['label']}");

                return $result;
            } catch (Exception $e) {
                Log::warning("Avatar validation tier {$tier['label']} failed: ".$e->getMessage());
                // Try next tier
            }
        }

        // Semua tier gagal → Layer 4 (manual review)
        Log::error('All AI tiers failed for avatar validation. Falling back to manual review.');

        return [
            'is_valid' => true, // Foto disimpan, tapi ditandai perlu review admin
            'reason' => null,
            'requires_manual_review' => true,
        ];
    }

    /**
     * Prioritas config resolver:
     *   1. .env (config('ai.failover.*'))
     *   2. SystemSetting di database (admin UI)
     */
    private function loadTiers(): array
    {
        $rizqunaUrl = config('ai.providers.rizquna.url')
            ?: SystemSetting::get('rizquna_url', 'https://router.rizquna.id/v1');
        $rizqunaKey = config('ai.providers.rizquna.key')
            ?: SystemSetting::get('rizquna_api_key');
        $rizqunaVisionModel = config('ai.providers.rizquna.models.vision.default')
            ?: config('ai.routing.vision.model', 'ag/gemini-3-flash');

        return [
            [
                'label' => 'primary',
                'url' => config('ai.failover.primary.url') ?: SystemSetting::get('ai_primary_url', $rizqunaUrl),
                'key' => config('ai.failover.primary.key') ?: SystemSetting::get('ai_primary_key', $rizqunaKey),
                'model' => config('ai.failover.primary.model') ?: SystemSetting::get('ai_primary_model', $rizqunaVisionModel),
            ],
            [
                'label' => 'fallback',
                'url' => config('ai.failover.fallback.url') ?: SystemSetting::get('ai_fallback_url', $rizqunaUrl),
                'key' => config('ai.failover.fallback.key') ?: SystemSetting::get('ai_fallback_key'),
                'model' => config('ai.failover.fallback.model') ?: SystemSetting::get('ai_fallback_model', $rizqunaVisionModel),
            ],
            [
                'label' => 'tertiary',
                'url' => config('ai.failover.tertiary.url') ?: SystemSetting::get('ai_tertiary_url', $rizqunaUrl),
                'key' => config('ai.failover.tertiary.key') ?: SystemSetting::get('ai_tertiary_key'),
                'model' => config('ai.failover.tertiary.model') ?: SystemSetting::get('ai_tertiary_model', $rizqunaVisionModel),
            ],
        ];
    }

    private function buildPayload(string $base64Image, string $mimeType): array
    {
        $prompt = 'Anda adalah petugas verifikasi dokumen akademik yang sangat ketat. '.
            'Analisis gambar yang dilampirkan dan pastikan HANYA lolos jika memenuhi SEMUA 3 syarat mutlak berikut: '.
            '1. Latar Belakang (Background) WAJIB berwarna MERAH polos. '.
            '2. Orang di dalam foto WAJIB mengenakan Jas Almamater kampus (berupa jas/blazer resmi). '.
            '3. Pose dan penampilan WAJIB formal (wajah menghadap lurus ke depan, mata menatap kamera, tidak memakai kacamata hitam, dan rambut/hijab tertata rapi). '.
            'Format balasan Anda HARUS berupa JSON murni dengan struktur berikut: '.
            '{"is_valid": true/false, "reason": "Kosongkan jika true. Jika false, sebutkan secara singkat dalam bahasa Indonesia mengapa ditolak."}';

        return [
            'stream' => false,
            'messages' => [
                [
                    'role' => 'user',
                    'content' => [
                        ['type' => 'text', 'text' => $prompt],
                        [
                            'type' => 'image_url',
                            'image_url' => [
                                'url' => "data:{$mimeType};base64,{$base64Image}",
                            ],
                        ],
                    ],
                ],
            ],
            'response_format' => ['type' => 'json_object'],
            'max_tokens' => 900,
            'temperature' => 0.1,
        ];
    }

    private function callOpenAICompatibleApi(string $baseUrl, string $apiKey, string $model, array $payload): array
    {
        $payload['model'] = $model;
        $endpoint = rtrim($baseUrl, '/').'/chat/completions';

        $response = Http::withToken($apiKey)
            ->timeout(20) // Vision API kadang lambat
            ->post($endpoint, $payload);

        if (! $response->successful()) {
            throw new Exception("HTTP {$response->status()}: ".$response->body());
        }

        $jsonResponse = $response->json();
        $content = $jsonResponse['choices'][0]['message']['content'] ?? '{}';

        // Bersihkan ```json ... ``` kalau AI kirim dengan markdown wrapper
        $content = preg_replace('/```json\s*/', '', $content);
        $content = preg_replace('/```/', '', (string) $content);
        $content = trim((string) $content);

        $decoded = json_decode($content, true);

        if (! is_array($decoded) || ! array_key_exists('is_valid', $decoded)) {
            throw new Exception("Invalid JSON response from AI: {$content}");
        }

        return [
            'is_valid' => (bool) $decoded['is_valid'],
            'reason' => $decoded['reason'] ?? null,
            'requires_manual_review' => false,
        ];
    }
}
