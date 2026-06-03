<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\SystemSetting;
use App\Services\WaGatewayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WaGatewayAdminController extends Controller
{
    public function show(): JsonResponse
    {
        $apiKey = (string) SystemSetting::get('wa_gateway_api_key', config('wa_gateway.api_key', ''));
        return $this->success(['config' => [
            'enabled' => SystemSetting::get('wa_gateway_enabled', config('wa_gateway.enabled') ? '1' : '0') === '1',
            'url' => SystemSetting::get('wa_gateway_url', config('wa_gateway.url', '')),
            'session' => SystemSetting::get('wa_gateway_session', config('wa_gateway.session', '')),
            'api_key_masked' => $apiKey !== '' ? substr($apiKey, 0, 4).'••••'.substr($apiKey, -4) : '',
            'has_api_key' => $apiKey !== '',
            'rate_limit_per_minute' => (int) SystemSetting::get('wa_gateway_rate_limit_per_minute', config('wa_gateway.rate_limit_per_minute', 10)),
            'rate_limit_per_phone_per_minute' => (int) SystemSetting::get('wa_gateway_rate_limit_per_phone_per_minute', config('wa_gateway.rate_limit_per_phone_per_minute', 2)),
        ]]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'url' => ['nullable', 'url', 'max:500'],
            'session' => ['nullable', 'string', 'max:100'],
            'api_key' => ['nullable', 'string', 'max:500'],
            'rate_limit_per_minute' => ['required', 'integer', 'min:1', 'max:60'],
            'rate_limit_per_phone_per_minute' => ['required', 'integer', 'min:1', 'max:10'],
        ]);

        SystemSetting::set('wa_gateway_enabled', $data['enabled'] ? '1' : '0');
        SystemSetting::set('wa_gateway_url', $data['url'] ?? '');
        SystemSetting::set('wa_gateway_session', $data['session'] ?? '');
        if (filled($data['api_key'] ?? null)) SystemSetting::set('wa_gateway_api_key', $data['api_key']);
        SystemSetting::set('wa_gateway_rate_limit_per_minute', (string) $data['rate_limit_per_minute']);
        SystemSetting::set('wa_gateway_rate_limit_per_phone_per_minute', (string) $data['rate_limit_per_phone_per_minute']);

        return $this->noContent('Konfigurasi WA Gateway berhasil disimpan.');
    }

    public function test(Request $request, WaGatewayService $wa): JsonResponse
    {
        $data = $request->validate(['phone' => ['required', 'string', 'max:30']]);
        $ok = $wa->sendMessage($data['phone'], 'Tes WhatsApp Gateway SIBERMAS berhasil.');
        return $this->success(['ok' => $ok, 'message' => $ok ? 'Pesan test terkirim.' : 'Pesan test gagal. Cek konfigurasi/rate-limit/log.']);
    }
}
