<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\SystemSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Inertia\Inertia;
use Inertia\Response;

class SystemSettingController extends Controller
{
    /**
     * Config keys that contain sensitive values and must be encrypted in DB.
     */
    private const SECRET_KEYS = [
        'master_api_client_secret',
        'master_api_token',
        'gemini_api_key',
        'storage_secret',
    ];

    /**
     * Display the system settings page.
     */
    public function index(): Response
    {
        $settings = SystemSetting::whereIn('group', ['master_api', 'general', 'ai_settings', 'storage_settings'])->get();

        // Ensure default settings exist if none found
        if ($settings->isEmpty() || !$settings->contains('group', 'storage_settings')) {
            $this->initializeDefaults();
            $settings = SystemSetting::whereIn('group', ['master_api', 'general', 'ai_settings', 'storage_settings'])->get();
        }

        // Decrypt secret values for display
        $settings->transform(function ($setting) {
            if (in_array($setting->config_key, self::SECRET_KEYS) && $setting->value) {
                try {
                    $setting->value = Crypt::decryptString($setting->value);
                }
                catch (\Illuminate\Contracts\Encryption\DecryptException $e) {
                // Value was stored before encryption was added; leave as-is
                }
            }
            return $setting;
        });

        return Inertia::render('Admin/Settings/System', [
            'settings' => $settings->groupBy('group'),
            'title' => 'Pengaturan Sistem & API'
        ]);
    }

    /**
     * Update settings.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.id' => 'required|exists:kkn.system_settings,id',
            'settings.*.value' => 'nullable|string',
        ]);

        foreach ($validated['settings'] as $item) {
            $setting = SystemSetting::find($item['id']);
            if ($setting) {
                $value = $item['value'];
                // Encrypt secret values before storing
                if (in_array($setting->config_key, self::SECRET_KEYS) && $value) {
                    $value = Crypt::encryptString($value);
                }
                $setting->update(['value' => $value]);
                // Clear cache for this specific key
                Cache::forget("system_setting_{$setting->config_key}");
            }
        }

        return back()->with('success', 'Pengaturan sistem berhasil diperbarui.');
    }

    /**
     * Initialize default settings from ENV if database is empty.
     */
    private function initializeDefaults(): void
    {
        $defaults = [
            [
                'config_key' => 'master_api_url',
                'label' => 'Master API URL',
                'value' => config('services.master_api.url'),
                'type' => 'text',
                'group' => 'master_api',
            ],
            [
                'config_key' => 'master_api_client_id',
                'label' => 'Master API Client ID',
                'value' => config('services.master_api.client_id'),
                'type' => 'text',
                'group' => 'master_api',
            ],
            [
                'config_key' => 'master_api_client_secret',
                'label' => 'Master API Client Secret',
                'value' => config('services.master_api.client_secret'),
                'type' => 'password',
                'group' => 'master_api',
            ],
            [
                'config_key' => 'master_api_token',
                'label' => 'Master API Static Token',
                'value' => config('masterapi.token'),
                'type' => 'password',
                'group' => 'master_api',
            ],
            // AI Settings Group
            [
                'config_key' => 'gemini_api_key',
                'label' => 'Google Gemini API Key',
                'value' => config('services.gemini.api_key'),
                'type' => 'password',
                'group' => 'ai_settings',
            ],
            [
                'config_key' => 'ai_enabled',
                'label' => 'Aktifkan AI Asisten (Laporan & Plagiasi)',
                'value' => 'false',
                'type' => 'text',
                'group' => 'ai_settings',
            ],
            // Storage Settings Group (Cloudready)
            [
                'config_key' => 'storage_cloud_enabled',
                'label' => 'Gunakan Cloud Storage (Cloudflare R2/S3)',
                'value' => 'false',
                'type' => 'text',
                'group' => 'storage_settings',
            ],
            [
                'config_key' => 'storage_key',
                'label' => 'Storage Access Key ID',
                'value' => null,
                'type' => 'text',
                'group' => 'storage_settings',
            ],
            [
                'config_key' => 'storage_secret',
                'label' => 'Storage Secret Access Key',
                'value' => null,
                'type' => 'password',
                'group' => 'storage_settings',
            ],
            [
                'config_key' => 'storage_bucket',
                'label' => 'Storage Bucket Name',
                'value' => null,
                'type' => 'text',
                'group' => 'storage_settings',
            ],
            [
                'config_key' => 'storage_endpoint',
                'label' => 'Storage Custom Endpoint (URL)',
                'value' => null,
                'type' => 'text',
                'group' => 'storage_settings',
            ],
            [
                'config_key' => 'storage_region',
                'label' => 'Storage Region',
                'value' => 'auto',
                'type' => 'text',
                'group' => 'storage_settings',
            ],
        ];

        foreach ($defaults as $data) {
            // Encrypt secret values before storing
            if (in_array($data['config_key'], self::SECRET_KEYS) && $data['value']) {
                $data['value'] = Crypt::encryptString($data['value']);
            }
            SystemSetting::updateOrCreate(['config_key' => $data['config_key']], $data);
        }
    }
}