<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WhatsAppGatewayService
{
    public function enabled(): bool
    {
        return (bool) config('services.whatsapp.enabled')
            && filled(config('services.whatsapp.url'))
            && filled(config('services.whatsapp.api_key'))
            && filled(config('services.whatsapp.session_name'));
    }

    public function normalizePhone(?string $phone): ?string
    {
        if (! $phone) return null;
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (! $phone) return null;
        if (Str::startsWith($phone, '0')) $phone = '62'.substr($phone, 1);
        if (Str::startsWith($phone, '8')) $phone = '62'.$phone;
        return Str::startsWith($phone, '62') ? $phone : null;
    }

    public function sendOtp(string $to, string $otp): array
    {
        if (! $this->enabled()) {
            return ['ok' => false, 'message' => 'WhatsApp gateway disabled or incomplete config'];
        }

        $to = $this->normalizePhone($to);
        if (! $to) {
            return ['ok' => false, 'message' => 'Invalid WhatsApp number'];
        }

        try {
            $response = Http::timeout((int) config('services.whatsapp.timeout', 15))
                ->acceptJson()
                ->asJson()
                ->withHeaders(['x-api-key' => (string) config('services.whatsapp.api_key')])
                ->post(rtrim((string) config('services.whatsapp.url'), '/').'/api/send-otp', [
                    'sessionName' => (string) config('services.whatsapp.session_name'),
                    'to' => $to,
                    'otp' => $otp,
                ]);

            $json = $response->json();
            $ok = $response->successful() && (bool) data_get($json, 'status');

            if (! $ok) {
                Log::warning('WhatsApp OTP send failed', [
                    'to' => $to,
                    'status' => $response->status(),
                    'body' => $json ?: $response->body(),
                ]);
            }

            return [
                'ok' => $ok,
                'status' => $response->status(),
                'message' => data_get($json, 'message', $ok ? 'OTP sent' : 'OTP failed'),
                'data' => $json,
            ];
        } catch (\Throwable $e) {
            Log::error('WhatsApp OTP exception', ['to' => $to, 'error' => $e->getMessage()]);
            return ['ok' => false, 'message' => $e->getMessage()];
        }
    }
}
