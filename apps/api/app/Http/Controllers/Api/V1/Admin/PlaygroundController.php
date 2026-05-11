<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Services\ActivityLogger;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * PlaygroundController — AI Playground untuk Superadmin (PRD_AI_PLAYGROUND.md).
 *
 * Memanfaatkan 3-tier Google AI Studio failover dari `config/ai.php`.
 * Support pemilihan provider + model dinamis, injeksi konteks SIBERMAS,
 * dan riwayat chat lokal (stateless — history di-manage di client).
 */
class PlaygroundController extends Controller
{
    use ApiResponse;

    /**
     * GET /admin/playground/models
     *
     * Daftar provider & model yang tersedia berdasarkan .env config.
     */
    public function models(): JsonResponse
    {
        $tiers = config('ai.failover');
        $providers = [];

        // Semua 3 tier biasanya pakai SumoPod yang sama — kita group jadi 1 "provider"
        // dengan daftar model dari SumoPod yang cocok untuk general chat + vision.
        $hasAnyKey = false;
        foreach (['primary', 'fallback', 'tertiary'] as $key) {
            if (! empty($tiers[$key]['key'] ?? null)) {
                $hasAnyKey = true;
                break;
            }
        }

        if ($hasAnyKey) {
            // Primary tier (display purpose)
            $tier = $tiers['primary'] ?? $tiers['fallback'] ?? $tiers['tertiary'];
            $providers[] = [
                'id' => 'primary',
                'name' => 'SumoPod',
                'base_url' => $tier['url'],
                'has_key' => true,
                'default_model' => $tier['model'],
                'models' => [
                    // ── VISION-CAPABLE (untuk avatar validation + konsultasi foto/dokumen) ──
                    ['id' => 'gemini/gemini-2.5-pro', 'name' => 'Gemini 2.5 Pro (vision)', 'category' => 'vision'],
                    ['id' => 'gemini/gemini-3-pro-preview', 'name' => 'Gemini 3 Pro Preview (vision)', 'category' => 'vision'],
                    ['id' => 'gemini/gemini-2.5-flash', 'name' => 'Gemini 2.5 Flash (vision)', 'category' => 'vision'],
                    ['id' => 'gemini/gemini-3-flash-preview', 'name' => 'Gemini 3 Flash Preview (vision)', 'category' => 'vision'],
                    ['id' => 'gpt-4o', 'name' => 'GPT-4o (vision)', 'category' => 'vision'],
                    ['id' => 'gpt-4o-mini', 'name' => 'GPT-4o Mini (vision)', 'category' => 'vision'],

                    // ── SMARTEST (high-reasoning untuk analisis kompleks) ──
                    ['id' => 'claude-opus-4-7', 'name' => 'Claude Opus 4.7 (1M ctx)', 'category' => 'smartest'],
                    ['id' => 'gpt-5.5-pro', 'name' => 'GPT-5.5 Pro (1M ctx)', 'category' => 'smartest'],
                    ['id' => 'deepseek-v4-pro', 'name' => 'DeepSeek V4 Pro (1M ctx)', 'category' => 'smartest'],
                    ['id' => 'claude-sonnet-4-6', 'name' => 'Claude Sonnet 4.6', 'category' => 'smartest'],
                    ['id' => 'gpt-5.4-pro', 'name' => 'GPT-5.4 Pro (1M ctx)', 'category' => 'smartest'],

                    // ── SMART (balanced general purpose) ──
                    ['id' => 'gpt-5.4', 'name' => 'GPT-5.4', 'category' => 'smart'],
                    ['id' => 'gpt-5.1', 'name' => 'GPT-5.1', 'category' => 'smart'],
                    ['id' => 'gpt-5', 'name' => 'GPT-5', 'category' => 'smart'],
                    ['id' => 'gpt-5.1-codex', 'name' => 'GPT-5.1 Codex', 'category' => 'smart'],
                    ['id' => 'deepseek-v3-2', 'name' => 'DeepSeek V3.2', 'category' => 'smart'],
                    ['id' => 'kimi-k2.6', 'name' => 'Kimi K2.6 (256K ctx)', 'category' => 'smart'],
                    ['id' => 'qwen3.6-plus', 'name' => 'Qwen 3.6 Plus (262K ctx)', 'category' => 'smart'],
                    ['id' => 'glm-5', 'name' => 'GLM-5', 'category' => 'smart'],

                    // ── FAST (cepat, untuk respons real-time) ──
                    ['id' => 'gpt-5.4-mini', 'name' => 'GPT-5.4 Mini', 'category' => 'fast'],
                    ['id' => 'gpt-5-mini', 'name' => 'GPT-5 Mini', 'category' => 'fast'],
                    ['id' => 'gpt-4.1-mini', 'name' => 'GPT-4.1 Mini', 'category' => 'fast'],
                    ['id' => 'claude-haiku-4-5', 'name' => 'Claude Haiku 4.5', 'category' => 'fast'],
                    ['id' => 'deepseek-v4-flash', 'name' => 'DeepSeek V4 Flash', 'category' => 'fast'],
                    ['id' => 'qwen3.6-flash', 'name' => 'Qwen 3.6 Flash', 'category' => 'fast'],

                    // ── FASTEST (paling cepat, low-latency) ──
                    ['id' => 'gpt-5.4-nano', 'name' => 'GPT-5.4 Nano', 'category' => 'fastest'],
                    ['id' => 'gpt-5-nano', 'name' => 'GPT-5 Nano', 'category' => 'fastest'],
                    ['id' => 'gemini/gemini-2.5-flash-lite', 'name' => 'Gemini 2.5 Flash Lite', 'category' => 'fastest'],
                    ['id' => 'gemini/gemini-3.1-flash-lite-preview', 'name' => 'Gemini 3.1 Flash Lite', 'category' => 'fastest'],
                ],
            ];
        }

        return $this->success([
            'providers' => $providers,
            'quick_prompts' => $this->quickPrompts(),
        ]);
    }

    /**
     * POST /admin/playground/chat
     */
    public function chat(Request $request): JsonResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:8000'],
            'provider' => ['nullable', 'in:primary,fallback,tertiary'],
            'model' => ['nullable', 'string', 'max:100'],
            'system_prompt' => ['nullable', 'string', 'max:4000'],
            'inject_context' => ['nullable', 'boolean'],
            'temperature' => ['nullable', 'numeric', 'between:0,2'],
            'max_tokens' => ['nullable', 'integer', 'between:50,4000'],
            'history' => ['nullable', 'array', 'max:20'],
            'history.*.role' => ['required_with:history', 'in:user,assistant'],
            'history.*.content' => ['required_with:history', 'string', 'max:8000'],
        ]);

        $tiers = config('ai.failover');
        $providerKey = $data['provider'] ?? 'primary';
        $tier = $tiers[$providerKey] ?? null;

        if (! $tier || empty($tier['key'])) {
            // Fallback ke tier lain yang ada key-nya
            foreach (['primary', 'fallback', 'tertiary'] as $k) {
                if (! empty($tiers[$k]['key'])) {
                    $tier = $tiers[$k];
                    $providerKey = $k;
                    break;
                }
            }
            if (! $tier || empty($tier['key'])) {
                return $this->error('AI_UNAVAILABLE', 'Tidak ada API key AI yang terkonfigurasi.', 503);
            }
        }

        $model = $data['model'] ?? $tier['model'];
        $systemPrompt = $data['system_prompt'] ?? $this->defaultSystemPrompt();
        if (($data['inject_context'] ?? true)) {
            $systemPrompt = $this->injectContext()."\n\n".$systemPrompt;
        }

        $messages = [['role' => 'system', 'content' => $systemPrompt]];
        foreach ($data['history'] ?? [] as $h) {
            $messages[] = ['role' => $h['role'], 'content' => $h['content']];
        }
        $messages[] = ['role' => 'user', 'content' => $data['message']];

        try {
            $answer = $this->callAi(
                $tier['url'],
                $tier['key'],
                $model,
                $messages,
                (float) ($data['temperature'] ?? 0.7),
                (int) ($data['max_tokens'] ?? 1500)
            );
        } catch (Exception $e) {
            Log::warning('Playground AI call failed', ['tier' => $providerKey, 'error' => $e->getMessage()]);

            return $this->error('AI_ERROR', 'AI gagal merespons: '.$e->getMessage(), 502);
        }

        ActivityLogger::log('ai_playground', 'success', $request->user()?->id, [
            'provider' => $providerKey,
            'model' => $model,
            'input_length' => strlen($data['message']),
            'output_length' => strlen($answer['content']),
        ]);

        return $this->success([
            'answer' => $answer['content'],
            'provider_used' => $providerKey,
            'model_used' => $model,
            'usage' => $answer['usage'],
        ]);
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     * @return array{content: string, usage: array<string, int>}
     */
    private function callAi(string $baseUrl, string $apiKey, string $model, array $messages, float $temperature, int $maxTokens): array
    {
        $endpoint = rtrim($baseUrl, '/').'/chat/completions';

        $response = Http::withToken($apiKey)->timeout(30)->post($endpoint, [
            'model' => $model,
            'messages' => $messages,
            'temperature' => $temperature,
            'max_tokens' => $maxTokens,
        ]);

        if (! $response->successful()) {
            throw new Exception("HTTP {$response->status()}: ".$response->body());
        }

        $json = $response->json();
        $content = $json['choices'][0]['message']['content'] ?? '';
        $usage = $json['usage'] ?? [];

        return [
            'content' => (string) $content,
            'usage' => [
                'input_tokens' => (int) ($usage['prompt_tokens'] ?? 0),
                'output_tokens' => (int) ($usage['completion_tokens'] ?? 0),
                'total_tokens' => (int) ($usage['total_tokens'] ?? 0),
            ],
        ];
    }

    private function defaultSystemPrompt(): string
    {
        return 'Anda adalah asisten AI untuk Superadmin SIBERMAS KKN UIN Prof. K.H. Saifuddin Zuhri Purwokerto. '
            .'Jawab dalam Bahasa Indonesia yang formal dan profesional. '
            .'Jika pertanyaan terkait data sistem, gunakan konteks yang disediakan. '
            .'Jika Anda tidak yakin, katakan tidak tahu — jangan mengarang.';
    }

    private function injectContext(): string
    {
        try {
            $activePeriod = Periode::where('is_active', true)->first();
            $totalMahasiswa = Mahasiswa::count();
            $pesertaAktif = PesertaKkn::where('periode_id', $activePeriod?->id)
                ->whereNotNull('kelompok_id')->count();

            return "[KONTEKS SISTEM SIBERMAS — Data Real-Time]\n"
                .'- Periode Aktif: '.($activePeriod?->name ?? 'Belum ada')."\n"
                .'- Fase Saat Ini: '.($activePeriod?->current_phase ?? '-')."\n"
                ."- Total Mahasiswa Terdaftar: {$totalMahasiswa}\n"
                ."- Mahasiswa Sudah Ditempatkan: {$pesertaAktif}\n"
                .'[/KONTEKS]';
        } catch (\Throwable $e) {
            return '[KONTEKS SISTEM SIBERMAS — Tidak tersedia]';
        }
    }

    /**
     * @return array<int, array{label: string, icon: string, prompt: string}>
     */
    private function quickPrompts(): array
    {
        return [
            [
                'label' => 'Buat Pengumuman',
                'icon' => 'megaphone',
                'prompt' => 'Buatkan pengumuman resmi UIN SAIZU tentang pembukaan pendaftaran KKN. Gunakan bahasa formal akademik, sertakan tanggal pelaksanaan dan kontak panitia.',
            ],
            [
                'label' => 'Analisis Data Pendaftaran',
                'icon' => 'bar-chart',
                'prompt' => 'Berdasarkan data konteks sistem, analisis status pendaftaran KKN saat ini: persentase sudah terdaftar vs belum, prediksi tren, dan rekomendasi.',
            ],
            [
                'label' => 'Draft Surat LPPM',
                'icon' => 'file-text',
                'prompt' => 'Buatkan draft surat resmi dari LPPM UIN SAIZU ke LP2M terkait laporan pelaksanaan KKN periode berjalan.',
            ],
            [
                'label' => 'Rekap Statistik',
                'icon' => 'trending-up',
                'prompt' => 'Buatkan ringkasan eksekutif statistik KKN minggu ini dalam format tabel markdown: jumlah mahasiswa aktif, laporan harian, incident, dan highlight.',
            ],
            [
                'label' => 'Review Prompt AI',
                'icon' => 'flask-conical',
                'prompt' => 'Saya ingin membuat prompt untuk validasi foto profil mahasiswa (syarat: background merah, jas almamater, pose formal). Beri saya prompt yang ketat dan format JSON response yang strict.',
            ],
        ];
    }
}
