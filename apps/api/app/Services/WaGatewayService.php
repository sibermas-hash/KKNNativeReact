<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\SystemSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WaGatewayService
{
    public function enabled(): bool
    {
        return (SystemSetting::get('wa_gateway_enabled', config('wa_gateway.enabled') ? '1' : '0') === '1')
            && filled(SystemSetting::get('wa_gateway_url', config('wa_gateway.url', '')))
            && filled(SystemSetting::get('wa_gateway_api_key', config('wa_gateway.api_key', '')))
            && filled(SystemSetting::get('wa_gateway_session', config('wa_gateway.session', '')));
    }

    public function sendMessage(string $to, string $message): bool
    {
        if (! $this->enabled()) return false;
        $phone = $this->normalizePhone($to);
        if ($phone === '') return false;

        if (! $this->withinRateLimit($phone, 'message')) {
            Log::warning('WA gateway rate limited', ['to' => $phone]);
            return false;
        }

        try {
            $response = Http::timeout((int) SystemSetting::get('wa_gateway_timeout', config('wa_gateway.timeout', 10)))
                ->withHeaders(['x-api-key' => (string) SystemSetting::get('wa_gateway_api_key', config('wa_gateway.api_key', ''))])
                ->post(rtrim((string) SystemSetting::get('wa_gateway_url', config('wa_gateway.url', '')), '/').'/api/send-message', [
                    'sessionName' => (string) SystemSetting::get('wa_gateway_session', config('wa_gateway.session', '')),
                    'to' => $phone,
                    'message' => $message,
                ]);

            if ($response->successful() && (bool) ($response->json('status') ?? false)) return true;

            Log::warning('WA gateway send failed', [
                'status' => $response->status(),
                'body' => $response->json() ?? $response->body(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('WA gateway exception', ['error' => $e->getMessage()]);
        }
        return false;
    }

    public function sendOtp(string $to, string $otp): bool
    {
        if (! $this->enabled()) return false;
        $phone = $this->normalizePhone($to);
        if ($phone === '') return false;

        if (! $this->withinRateLimit($phone, 'otp')) {
            Log::warning('WA gateway OTP rate limited', ['to' => $phone]);
            return false;
        }

        try {
            $response = Http::timeout((int) SystemSetting::get('wa_gateway_timeout', config('wa_gateway.timeout', 10)))
                ->withHeaders(['x-api-key' => (string) SystemSetting::get('wa_gateway_api_key', config('wa_gateway.api_key', ''))])
                ->post(rtrim((string) SystemSetting::get('wa_gateway_url', config('wa_gateway.url', '')), '/').'/api/send-otp', [
                    'sessionName' => (string) SystemSetting::get('wa_gateway_session', config('wa_gateway.session', '')),
                    'to' => $phone,
                    'otp' => $otp,
                ]);
            return $response->successful() && (bool) ($response->json('status') ?? false);
        } catch (\Throwable $e) {
            Log::warning('WA gateway OTP exception', ['error' => $e->getMessage()]);
            return false;
        }
    }

    public function normalizePhone(?string $phone): string
    {
        $digits = preg_replace('/\D+/', '', (string) $phone) ?? '';
        if ($digits === '') return '';
        if (str_starts_with($digits, '0')) return '62'.substr($digits, 1);
        if (str_starts_with($digits, '8')) return '62'.$digits;
        return $digits;
    }
}
