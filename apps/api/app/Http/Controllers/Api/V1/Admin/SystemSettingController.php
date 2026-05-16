<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Jobs\ResetPendaftaranJob;
use App\Models\KKN\SystemSetting;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SystemSettingController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        return $this->success(['settings' => SystemSetting::pluck('value', 'config_key')]);
    }

    public function update(Request $request): JsonResponse
    {
        foreach ($request->validate(['settings' => ['required', 'array']])['settings'] as $key => $value) {
            SystemSetting::set($key, $value);
        }

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
            if ($value !== null) {
                SystemSetting::set($key, $value);
            }
        }

        return $this->noContent('Pengaturan AI berhasil diperbarui.');
    }

    public function removeAiKey(): JsonResponse
    {
        SystemSetting::set('gemini_api_key', null);

        return $this->noContent('API key AI berhasil dihapus.');
    }

    public function resetPendaftaran(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'confirmation' => ['required', 'string', 'in:HAPUS SEMUA DATA PENDAFTARAN'],
            'soft' => ['sometimes', 'boolean'],
        ]);

        $user = $request->user();
        if ($user === null) {
            return $this->unauthorized();
        }

        try {
            // Preserve current access token supaya operator tidak force-logout
            // saat job memanggil `pendaftaran:reset` yang truncate tokens.
            $currentToken = $user->currentAccessToken();
            $keepTokenId = $currentToken !== null && isset($currentToken->id) ? (int) $currentToken->id : null;

            // Audit log SEBELUM dispatch — trail tetap tercatat walau job gagal.
            AuditService::log(
                'RESET_PENDAFTARAN_INITIATED',
                'Reset pendaftaran di-initiate dari admin panel ('.($validated['soft'] ?? false ? 'soft' : 'full').')',
                null,
                null,
                [
                    'mode' => $validated['soft'] ?? false ? 'soft' : 'full',
                    'keep_token_id' => $keepTokenId,
                ],
                (int) $user->id
            );

            // Dispatch ke queue 'long' — response cepat, kerja berat di background.
            ResetPendaftaranJob::dispatch(
                (int) $user->id,
                $keepTokenId,
                (bool) ($validated['soft'] ?? false),
            );

            return $this->success(
                [
                    'status' => 'queued',
                    'message' => 'Reset sedang diproses di background. Cek log audit untuk konfirmasi.',
                ],
                'Reset pendaftaran dijadwalkan.',
                202
            );
        } catch (\Throwable $e) {
            Log::error('resetPendaftaran dispatch failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return $this->serverError('Gagal menjadwalkan reset: '.$e->getMessage());
        }
    }
}
