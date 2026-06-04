<?php

declare(strict_types=1);

namespace App\Services\AI;

use App\Services\WaGatewayService;
use Illuminate\Support\Facades\Log;
use function Laravel\Ai\agent;

class AdminSibermasAiService
{
    public function __construct(private WaGatewayService $waGateway) {}

    public function handleWaInbound(array $payload): array
    {
        $from = (string) ($payload['from'] ?? $payload['remoteJid'] ?? '');
        $text = trim((string) ($payload['message'] ?? $payload['text'] ?? $payload['content'] ?? ''));
        $phone = $this->waGateway->normalizePhone($from);
        if ($text === '' || $phone === '') return ['status' => 'ignored'];

        $result = $this->classifyAndReply($phone, $text);
        $auto = (bool) config('wa_gateway.ai_auto_send', false) && (bool) ($result['should_auto_send'] ?? false);
        $reply = trim((string) ($result['reply'] ?? ''));
        if ($auto && $reply !== '') $result['sent'] = $this->waGateway->sendMessage($phone, $reply);
        Log::info('Admin Sibermas WA AI processed', ['phone' => $phone, 'intent' => $result['intent'] ?? null, 'auto' => $auto]);
        return ['status' => 'processed', 'phone' => $phone, 'ai' => $result];
    }

    public function classifyAndReply(string $phone, string $message): array
    {
        $instructions = <<<'PROMPT'
Anda adalah Admin Sibermas, asisten administrasi digital untuk sistem KKN/SIBERMAS UIN Saizu/LPPM. Bantu admin merespons WA terkait KKN, pendaftaran, berkas, kelompok, DPL, lokasi/posko, absensi, laporan, sertifikat, workshop, pengumuman, kendala akun, atau bantuan. Bahasa Indonesia, sopan, jelas, netral, singkat. Jangan mengarang kebijakan/jadwal/status resmi/kelulusan/nilai/plotting/keputusan admin. Auto-send hanya untuk sapaan, info umum, permintaan data kurang, arahan portal. Escalate untuk keluhan serius, data sensitif, nilai/sertifikat resmi, perubahan data, keputusan pendaftaran, konflik, keamanan/kesehatan, pembayaran, atau pesan tidak jelas. Return JSON only: {"intent":"sapaan|info_layanan|pendaftaran_kkn|berkas|cek_status|kelompok_dpl|lokasi_posko|absensi|laporan|sertifikat|workshop|kendala_akun|pengaduan|unknown","confidence":0.0,"should_auto_send":false,"reply":"...","case_type":"...","priority":"low|normal|high|urgent","required_fields_missing":[],"crm_action":"create_case|update_case|none","summary":"...","tags":[],"escalate":true}
PROMPT;
        try {
            $response = agent(instructions: $instructions)->prompt(
                prompt: "Nomor WA: {$phone}\nPesan:\n{$message}\n\nKembalikan JSON saja.",
                provider: (string) config('ai.routing.assistant.provider', config('ai.default', 'rizquna')),
                model: (string) config('ai.routing.assistant.model', config('ai.providers.rizquna.models.text.default', 'gc/gemini-3-pro-preview'))
            );
            $raw = trim((string) $response->text);
            $raw = preg_replace('/^```json\s*|\s*```$/m', '', $raw) ?: $raw;
            $data = json_decode($raw, true);
            if (! is_array($data)) throw new \RuntimeException('Invalid AI JSON');
            return $data;
        } catch (\Throwable $e) {
            Log::warning('Admin Sibermas AI failed', ['error' => $e->getMessage()]);
            return ['intent'=>'unknown','confidence'=>0,'should_auto_send'=>false,'reply'=>'Terima kasih, pesan Anda sudah diterima. Admin akan menindaklanjuti.','case_type'=>'fallback','priority'=>'normal','required_fields_missing'=>[],'crm_action'=>'create_case','summary'=>$message,'tags'=>['ai_failed'],'escalate'=>true];
        }
    }
}
