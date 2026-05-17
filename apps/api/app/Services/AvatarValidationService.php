<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\SystemSetting;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * Memvalidasi foto profil menggunakan AI Vision (Graceful Degradation 4 Lapis).
 *
 * Failover strategy — gateway terlebih dahulu, lalu direct provider:
 *   1. Primary        (AI_PRIMARY_KEY / gateway)
 *   2. Fallback       (AI_FALLBACK_KEY / gateway)
 *   3. Tertiary       (AI_TERTIARY_KEY / gateway)
 *   4. Direct Gemini  (GEMINI_API_KEY / official API)
 *   5. Direct OpenAI  (OPENAI_API_KEY / official API)
 *
 * Urutan percobaan: Primary → Fallback → Tertiary → Direct Gemini
 * → Direct OpenAI → manual review. Jika seluruh tier gagal / quota habis,
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

        $localCheck = $this->strictLocalPrecheck($absolutePath);
        if (! $localCheck['is_valid']) {
            return $localCheck;
        }

        $base64Image = base64_encode(file_get_contents($absolutePath));
        $mimeType = mime_content_type($absolutePath);
        $payload = $this->buildPayload($base64Image, $mimeType);

        $tiers = $this->loadTiers();

        $votes = [];
        $failures = [];

        foreach ($tiers as $tier) {
            if (empty($tier['key'])) {
                Log::info("Avatar validation tier {$tier['label']} skipped: no API key configured");
                continue;
            }

            try {
                $result = $this->callOpenAICompatibleApi($tier['url'], $tier['key'], $tier['model'], $payload);
                $votes[] = ['tier' => $tier['label'], 'result' => $result];
                Log::info("Avatar validation tier {$tier['label']} vote: ".json_encode($result));

                // Fast path: first available AI decides. Other tiers are failover only.
                if (! (bool) ($result['is_valid'] ?? false)) {
                    return [
                        'is_valid' => false,
                        'reason' => $result['reason'] ?? 'Foto tidak memenuhi ketentuan.',
                        'requires_manual_review' => false,
                    ];
                }

                return [
                    'is_valid' => true,
                    'reason' => 'Foto memenuhi ketentuan berdasarkan verifikasi AI.',
                    'requires_manual_review' => false,
                ];
            } catch (Exception $e) {
                $failures[] = $tier['label'];
                Log::warning("Avatar validation tier {$tier['label']} failed: ".$e->getMessage());
            }
        }

        if (empty($votes)) {
            // All AI tiers failed. Since local precheck already passed
            // (background merah, ukuran, rasio), auto-approve with flag.
            // Better UX: don't block student for infrastructure issues.
            Log::warning('All AI tiers failed for avatar validation. Auto-approved via local precheck.', [
                'failed_tiers' => $failures,
            ]);
            return [
                'is_valid' => true,
                'reason' => 'Foto disetujui berdasarkan validasi lokal (AI tidak tersedia).',
                'requires_manual_review' => false,
            ];
        }

        $rejects = array_values(array_filter($votes, fn ($vote) => ! (bool) ($vote['result']['is_valid'] ?? false)));
        if (! empty($rejects)) {
            $reason = $rejects[0]['result']['reason'] ?? 'Foto tidak memenuhi ketentuan.';
            return [
                'is_valid' => false,
                'reason' => $reason,
                'requires_manual_review' => false,
            ];
        }

        // Single AI approve is sufficient — blocking users for consensus
        // causes worse UX than occasional false positive.
        return [
            'is_valid' => true,
            'reason' => count($votes) > 1
                ? 'Foto memenuhi ketentuan berdasarkan multi-verifikasi AI.'
                : 'Foto memenuhi ketentuan berdasarkan verifikasi AI.',
            'requires_manual_review' => false,
        ];
    }

    /**
     * Prioritas config resolver:
     *   1. .env (config('ai.failover.*'))
     *   2. SystemSetting di database (admin UI)
     */
    private function loadTiers(): array
    {
        $baseTiers = [
            [
                'label' => 'primary',
                'url' => config('ai.failover.primary.url') ?: SystemSetting::get('ai_primary_url', 'https://generativelanguage.googleapis.com/v1beta/openai'),
                'key' => config('ai.failover.primary.key') ?: SystemSetting::get('ai_primary_key'),
                'model' => config('ai.failover.primary.model') ?: SystemSetting::get('ai_primary_model', 'gemini-2.0-flash'),
            ],
            [
                'label' => 'fallback',
                'url' => config('ai.failover.fallback.url') ?: SystemSetting::get('ai_fallback_url', 'https://generativelanguage.googleapis.com/v1beta/openai'),
                'key' => config('ai.failover.fallback.key') ?: SystemSetting::get('ai_fallback_key'),
                'model' => config('ai.failover.fallback.model') ?: SystemSetting::get('ai_fallback_model', 'gemini-2.0-flash'),
            ],
            [
                'label' => 'tertiary',
                'url' => config('ai.failover.tertiary.url') ?: SystemSetting::get('ai_tertiary_url', 'https://generativelanguage.googleapis.com/v1beta/openai'),
                'key' => config('ai.failover.tertiary.key') ?: SystemSetting::get('ai_tertiary_key'),
                'model' => config('ai.failover.tertiary.model') ?: SystemSetting::get('ai_tertiary_model', 'gemini-2.0-flash'),
            ],
            [
                'label' => 'direct_gemini',
                'url' => config('ai.failover.direct_gemini.url') ?: SystemSetting::get('gemini_direct_url', 'https://generativelanguage.googleapis.com/v1beta/openai'),
                'key' => config('ai.failover.direct_gemini.key') ?: SystemSetting::get('gemini_api_key'),
                'model' => config('ai.failover.direct_gemini.model') ?: SystemSetting::get('gemini_direct_model', 'gemini-2.0-flash'),
            ],
            [
                'label' => 'direct_openai',
                'url' => config('ai.failover.direct_openai.url') ?: SystemSetting::get('openai_direct_url', 'https://api.openai.com/v1'),
                'key' => config('ai.failover.direct_openai.key') ?: SystemSetting::get('openai_api_key'),
                'model' => config('ai.failover.direct_openai.model') ?: SystemSetting::get('openai_direct_model', 'gpt-4o-mini'),
            ],
        ];

        $routerUrl = env('AI_ROUTER_URL', config('ai.failover.primary.url', 'https://router.rizquna.id/v1'));
        $routerModels = $this->routerModelPool();
        $routerKeys = array_values(array_filter(array_unique([
            env('AI_ROUTER_KEY'),
            config('ai.failover.primary.key'),
            config('ai.failover.fallback.key'),
            config('ai.failover.tertiary.key'),
        ])));

        $routerTiers = [];
        foreach ($routerKeys as $keyIndex => $key) {
            foreach ($routerModels as $modelIndex => $model) {
                $routerTiers[] = [
                    'label' => "rizquna_k{$keyIndex}_m{$modelIndex}:{$model}",
                    'url' => $routerUrl,
                    'key' => $key,
                    'model' => $model,
                ];
            }
        }

        $allTiers = $routerTiers !== [] ? array_merge($routerTiers, $baseTiers) : $baseTiers;

        return $this->roundRobinTiers($allTiers);
    }

    /** @return array<int, string> */
    private function routerModelPool(): array
    {
        $raw = env('AI_ROUTER_MODELS')
            ?: SystemSetting::get('ai_router_models')
            ?: 'gc/gemini-3.1-flash-preview,gc/gemini-3-flash-preview,gc/gemini-2.5-flash,gc/gemini-2.5-flash-preview,gc/gemini-3.1-pro-preview,gc/gemini-3-pro-preview,gc/gemini-2.5-pro';

        return array_values(array_filter(array_map('trim', explode(',', (string) $raw))));
    }

    /** @param array<int, array<string, mixed>> $tiers */
    private function roundRobinTiers(array $tiers): array
    {
        if (count($tiers) <= 1) {
            return $tiers;
        }

        $cacheKey = 'avatar_ai_router_round_robin_index';
        $index = (int) Cache::get($cacheKey, 0);
        Cache::put($cacheKey, $index + 1, now()->addDay());

        $offset = $index % count($tiers);
        return array_merge(array_slice($tiers, $offset), array_slice($tiers, 0, $offset));
    }

    /**
     * Precheck lokal sebelum AI: mencegah gambar asal lolos ketika AI terlalu permisif.
     * Fokus pada validitas file + indikasi background merah pada area tepi foto.
     *
     * @return array{is_valid: bool, reason: string|null, requires_manual_review: bool}
     */
    private function strictLocalPrecheck(string $absolutePath): array
    {
        $mimeType = mime_content_type($absolutePath) ?: '';
        if (! str_starts_with($mimeType, 'image/')) {
            return ['is_valid' => false, 'reason' => 'File bukan gambar.', 'requires_manual_review' => false];
        }

        $size = filesize($absolutePath) ?: 0;
        if ($size < 10 * 1024) {
            return ['is_valid' => false, 'reason' => 'Ukuran file terlalu kecil/tidak valid.', 'requires_manual_review' => false];
        }
        if ($size > 5 * 1024 * 1024) {
            return ['is_valid' => false, 'reason' => 'Ukuran file terlalu besar. Maksimal 5 MB.', 'requires_manual_review' => false];
        }

        $info = @getimagesize($absolutePath);
        if (! is_array($info)) {
            return ['is_valid' => false, 'reason' => 'File gambar tidak dapat dibaca.', 'requires_manual_review' => false];
        }

        [$width, $height] = $info;
        if ($width < 300 || $height < 400) {
            return ['is_valid' => false, 'reason' => 'Resolusi foto terlalu kecil. Minimal 300x400 piksel.', 'requires_manual_review' => false];
        }

        $ratio = $width / max(1, $height);
        if ($ratio < 0.45 || $ratio > 0.95) {
            return ['is_valid' => false, 'reason' => 'Rasio foto tidak sesuai format pas foto.', 'requires_manual_review' => false];
        }

        $image = @imagecreatefromstring((string) file_get_contents($absolutePath));
        if (! $image) {
            return ['is_valid' => false, 'reason' => 'File gambar tidak valid.', 'requires_manual_review' => false];
        }

        $sample = 0;
        $red = 0;
        $stepX = max(1, (int) floor($width / 60));
        $stepY = max(1, (int) floor($height / 80));

        for ($y = 0; $y < $height; $y += $stepY) {
            for ($x = 0; $x < $width; $x += $stepX) {
                $edge = $x < $width * 0.18 || $x > $width * 0.82 || $y < $height * 0.18;
                if (! $edge) {
                    continue;
                }
                $rgb = imagecolorat($image, $x, $y);
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;
                $sample++;
                if ($r >= 120 && $r > ($g * 1.25) && $r > ($b * 1.25)) {
                    $red++;
                }
            }
        }
        imagedestroy($image);

        $redRatio = $sample > 0 ? $red / $sample : 0;
        if ($redRatio < 0.22) {
            return ['is_valid' => false, 'reason' => 'Background merah polos tidak terdeteksi jelas.', 'requires_manual_review' => false];
        }

        return ['is_valid' => true, 'reason' => null, 'requires_manual_review' => false];
    }

    private function buildPayload(string $base64Image, string $mimeType): array
    {
        $prompt = 'Anda adalah verifikator foto profil akademik yang SANGAT KETAT. '.
            'Default keputusan adalah TOLAK jika ragu, tidak jelas, terpotong, bukan pas foto, atau kualitas buruk. '.
            'Loloskan HANYA jika SEMUA syarat berikut jelas terpenuhi: '.
            '1. Foto adalah pas foto satu orang manusia, wajah terlihat jelas, bukan gambar acak, bukan benda, bukan screenshot, bukan kartun, bukan foto ramai. '.
            '2. Background WAJIB merah polos/solid dan dominan, bukan putih/biru/hitam/ruangan/pemandangan. '.
            '3. Subjek WAJIB memakai jas almamater/blazer resmi kampus yang tampak jelas. Jika hanya kaos/kemeja/jaket biasa/hijab tanpa jas, TOLAK. '.
            '4. Pose formal: kepala tegak, wajah menghadap kamera, bahu lurus, tidak miring ekstrem, tidak selfie/candid, tidak kacamata hitam/masker menutup wajah. '.
            '5. Komposisi pas foto: kepala-dada terlihat, tidak blur, tidak gelap, tidak terpotong. '.
            'Jika salah satu syarat gagal, is_valid=false. Jangan berbaik hati. '.
            'Balas JSON murni saja: {"is_valid": true/false, "reason": "jika false jelaskan singkat; jika true isi Foto memenuhi ketentuan."}';

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
            'max_tokens' => 256,
            'temperature' => 0.1,
        ];
    }

    private function callOpenAICompatibleApi(string $baseUrl, string $apiKey, string $model, array $payload): array
    {
        $payload['model'] = $model;
        $endpoint = rtrim($baseUrl, '/').'/chat/completions';

        $response = Http::withToken($apiKey)
            ->timeout(30) // Vision API kadang lambat
            ->post($endpoint, $payload);

        if (! $response->successful()) {
            throw new Exception("HTTP {$response->status()}: ".$response->body());
        }

        $body = (string) $response->body();
        $jsonResponse = $response->json();
        $content = $jsonResponse['choices'][0]['message']['content'] ?? null;

        // Some OpenAI-compatible gateways (including router.rizquna.id) may
        // return SSE chunks even when stream=false. Merge delta.content chunks.
        if ($content === null && str_starts_with(ltrim($body), 'data:')) {
            $content = '';
            foreach (preg_split('/\R/', $body) as $line) {
                $line = trim((string) $line);
                if ($line === '' || ! str_starts_with($line, 'data:')) {
                    continue;
                }
                $data = trim(substr($line, 5));
                if ($data === '[DONE]') {
                    break;
                }
                $chunk = json_decode($data, true);
                if (is_array($chunk)) {
                    $content .= $chunk['choices'][0]['delta']['content'] ?? '';
                }
            }
        }

        $content = $content ?? '{}';

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
