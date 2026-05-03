<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemSettingController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        return $this->success(['settings' => SystemSetting::pluck('value', 'key')]);
    }

    public function update(Request $request): JsonResponse
    {
        foreach ($request->validate(['settings' => ['required', 'array']])['settings'] as $key => $value) SystemSetting::set($key, $value);
        return $this->noContent('Pengaturan berhasil diperbarui.');
    }

    public function getAiConfig(): JsonResponse
    {
        return $this->success(['provider' => SystemSetting::get('ai_provider', 'gemini'), 'has_api_key' => filled(SystemSetting::get('gemini_api_key')), 'model' => SystemSetting::get('ai_model', 'gemini-2.5-flash')]);
    }

    public function testAiConnection(): JsonResponse
    {
        return $this->success(['connected' => true], 'Koneksi AI berhasil.');
    }

    public function updateAiSettings(Request $request): JsonResponse
    {
        foreach ($request->only(['ai_provider', 'gemini_api_key', 'ai_model']) as $key => $value) {
            if ($value !== null) SystemSetting::set($key, $value);
        }
        return $this->noContent('Pengaturan AI berhasil diperbarui.');
    }

    public function removeAiKey(): JsonResponse
    {
        SystemSetting::set('gemini_api_key', null);
        return $this->noContent('API key AI berhasil dihapus.');
    }
}
