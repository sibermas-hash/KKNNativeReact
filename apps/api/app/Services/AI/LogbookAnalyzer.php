<?php

declare(strict_types=1);

namespace App\Services\AI;

use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\SystemSetting;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * LogbookAnalyzer — analisis AI untuk laporan harian KKN.
 *
 * Memanfaatkan 3-tier SumoPod failover dari `config/ai.php` (sama seperti
 * AvatarValidationService). Output structured JSON:
 *   - summary: ringkasan 1-2 kalimat
 *   - quality_score: 1-10 kualitas narasi & refleksi
 *   - abcd_compliance: 1-10 kepatuhan metodologi ABCD
 *   - flagged: bool — ada red flag (plagiat/tidak relevan/tidak pantas)
 *   - flag_reason: string|null — alasan flag
 *   - feedback: string — saran perbaikan singkat
 *   - tags: array<string> — kategorisasi kegiatan
 *
 * Integrasi: dipanggil via `ProcessActivityAiAnalysis` job dari `KegiatanKkn::booted()`
 * setiap kali kegiatan dibuat/di-submit.
 */
class LogbookAnalyzer
{
    /**
     * @return array{
     *     success: bool,
     *     summary: string,
     *     quality_score: int,
     *     abcd_compliance: int,
     *     flagged: bool,
     *     flag_reason: string|null,
     *     feedback: string,
     *     tags: array<int, string>,
     *     provider_used: string|null,
     *     error: string|null,
     * }
     */
    public function analyzeEntry(KegiatanKkn $kegiatan): array
    {
        $payload = $this->buildPayload($kegiatan);
        $tiers = $this->loadTiers();

        foreach ($tiers as $tier) {
            if (empty($tier['key'])) {
                continue;
            }

            try {
                $parsed = $this->callAi($tier['url'], $tier['key'], $tier['model'], $payload);
                Log::info("LogbookAnalyzer: succeeded on tier {$tier['label']}", ['activity_id' => $kegiatan->id]);

                return $this->normalizeResult($parsed, $tier['label']);
            } catch (Exception $e) {
                Log::warning("LogbookAnalyzer tier {$tier['label']} failed: ".$e->getMessage(), ['activity_id' => $kegiatan->id]);
                // try next tier
            }
        }

        // All tiers failed — return stub with error flag
        return [
            'success' => false,
            'summary' => '',
            'quality_score' => 0,
            'abcd_compliance' => 0,
            'flagged' => false,
            'flag_reason' => null,
            'feedback' => '',
            'tags' => [],
            'provider_used' => null,
            'error' => 'Semua tier AI gagal merespons.',
        ];
    }

    /**
     * @return array<int, array<string, string|null>>
     */
    private function loadTiers(): array
    {
        return [
            [
                'label' => 'primary',
                'url' => config('ai.failover.primary.url') ?: SystemSetting::get('ai_primary_url', 'https://ai.sumopod.com/v1'),
                'key' => config('ai.failover.primary.key') ?: SystemSetting::get('ai_primary_key'),
                'model' => config('ai.failover.primary.model') ?: SystemSetting::get('ai_primary_model', 'gemini/gemini-2.5-pro'),
            ],
            [
                'label' => 'fallback',
                'url' => config('ai.failover.fallback.url') ?: SystemSetting::get('ai_fallback_url', 'https://ai.sumopod.com/v1'),
                'key' => config('ai.failover.fallback.key') ?: SystemSetting::get('ai_fallback_key'),
                'model' => config('ai.failover.fallback.model') ?: SystemSetting::get('ai_fallback_model', 'gemini/gemini-2.5-flash'),
            ],
            [
                'label' => 'tertiary',
                'url' => config('ai.failover.tertiary.url') ?: SystemSetting::get('ai_tertiary_url', 'https://ai.sumopod.com/v1'),
                'key' => config('ai.failover.tertiary.key') ?: SystemSetting::get('ai_tertiary_key'),
                'model' => config('ai.failover.tertiary.model') ?: SystemSetting::get('ai_tertiary_model', 'gpt-4o'),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildPayload(KegiatanKkn $kegiatan): array
    {
        $systemPrompt = <<<'PROMPT'
Anda adalah Asisten Pakar Audit KKN berbasis metodologi ABCD (Asset-Based Community Development).
Analisis laporan harian mahasiswa KKN dan kembalikan JSON STRICT dengan format berikut — JANGAN tambahkan teks lain:

{
  "summary": "Ringkasan singkat 1-2 kalimat dalam Bahasa Indonesia formal",
  "quality_score": 1-10 (integer; nilai kualitas narasi, deskripsi aktivitas, dan refleksi),
  "abcd_compliance": 1-10 (integer; seberapa jauh kegiatan selaras dengan prinsip ABCD: identifikasi aset, partisipasi warga, pemberdayaan),
  "flagged": true/false (true jika ada INDIKASI plagiat/copy-paste, tidak relevan KKN, bahasa kasar, atau tidak pantas),
  "flag_reason": "alasan singkat jika flagged=true; null jika flagged=false",
  "feedback": "1-2 kalimat saran perbaikan konstruktif untuk mahasiswa",
  "tags": ["max 3 kategori: Keagamaan/Pendidikan/Kesehatan/Ekonomi/Lingkungan/Sosial/Kepemudaan/Pemberdayaan/Teknologi/Administrasi"]
}

STRICT RULES:
- quality_score < 4 jika narasi kurang dari 50 karakter atau tidak informatif
- flagged=true jika terdeteksi copy-paste dari sumber generik, tidak spesifik lokasi/waktu, atau narasi menyebutkan kegiatan non-KKN
- tags harus dari daftar di atas, maksimum 3 tag
PROMPT;

        $userPrompt = sprintf(
            "ANALISIS LAPORAN BERIKUT:\n\nJudul: %s\nTahapan ABCD: %s\nAktivitas: %s\nRefleksi: %s",
            $kegiatan->title ?? '-',
            $kegiatan->abcd_stage ?? '-',
            $kegiatan->activity ?? '-',
            $kegiatan->reflection ?? '-'
        );

        return [
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $userPrompt],
            ],
            'temperature' => 0.2,
            'max_tokens' => 800,
            'response_format' => ['type' => 'json_object'],
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function callAi(string $baseUrl, string $apiKey, string $model, array $payload): array
    {
        $endpoint = rtrim($baseUrl, '/').'/chat/completions';

        $response = Http::withToken($apiKey)
            ->timeout(45)
            ->retry(2, 1000, throw: false)
            ->post($endpoint, [
                'model' => $model,
                ...$payload,
            ]);

        if (! $response->successful()) {
            throw new Exception("HTTP {$response->status()}: ".mb_substr($response->body(), 0, 300));
        }

        $json = $response->json();
        $content = $json['choices'][0]['message']['content'] ?? '';
        if ($content === '') {
            throw new Exception('AI response kosong.');
        }

        // Strip markdown code fence jika model bungkus dengan ```json ... ```
        $content = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', trim((string) $content));

        $decoded = json_decode((string) $content, true);
        if (! is_array($decoded)) {
            throw new Exception('AI response bukan JSON valid: '.mb_substr((string) $content, 0, 200));
        }

        return $decoded;
    }

    /**
     * @param  array<string, mixed>  $raw
     * @return array<string, mixed>
     */
    private function normalizeResult(array $raw, string $tier): array
    {
        return [
            'success' => true,
            'summary' => (string) ($raw['summary'] ?? ''),
            'quality_score' => max(0, min(10, (int) ($raw['quality_score'] ?? 0))),
            'abcd_compliance' => max(0, min(10, (int) ($raw['abcd_compliance'] ?? 0))),
            'flagged' => (bool) ($raw['flagged'] ?? false),
            'flag_reason' => $raw['flag_reason'] ?? null,
            'feedback' => (string) ($raw['feedback'] ?? ''),
            'tags' => array_slice(
                array_values(array_filter(
                    (array) ($raw['tags'] ?? []),
                    fn ($t) => is_string($t) && trim($t) !== ''
                )),
                0,
                3
            ),
            'provider_used' => $tier,
            'error' => null,
        ];
    }
}
