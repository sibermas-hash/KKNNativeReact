<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WaGatewayService
{
    public function enabled(): bool
    {
        return (bool) config('wa_gateway.enabled')
            && filled(config('wa_gateway.url'))
            && filled(config('wa_gateway.api_key'))
            && filled(config('wa_gateway.session'));
    }

    public function sendMessage(string $to, string $message): bool
    {
        if (! $this->enabled()) return false;
        $phone = $this->normalizePhone($to);
        if ($phone === '') return false;

        try {
            $response = Http::timeout((int) config('wa_gateway.timeout', 10))
                ->withHeaders(['x-api-key' => (string) config('wa_gateway.api_key')])
                ->post(rtrim((string) config('wa_gateway.url'), '/').'/api/send-message', [
                    'sessionName' => (string) config('wa_gateway.session'),
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

        try {
            $response = Http::timeout((int) config('wa_gateway.timeout', 10))
                ->withHeaders(['x-api-key' => (string) config('wa_gateway.api_key')])
                ->post(rtrim((string) config('wa_gateway.url'), '/').'/api/send-otp', [
                    'sessionName' => (string) config('wa_gateway.session'),
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
