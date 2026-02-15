<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\SystemSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class SystemSettingController extends Controller
{
    /**
     * Display the system settings page.
     */
    public function index(): Response
    {
        $settings = SystemSetting::whereIn('group', ['master_api', 'general'])->get()->groupBy('group');

        // Ensure default settings exist if none found
        if ($settings->isEmpty()) {
            $this->initializeDefaults();
            $settings = SystemSetting::whereIn('group', ['master_api', 'general'])->get()->groupBy('group');
        }

        return Inertia::render('Admin/Settings/System', [
            'settings' => $settings,
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
                $setting->update(['value' => $item['value']]);
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
        ];

        foreach ($defaults as $data) {
            SystemSetting::updateOrCreate(['config_key' => $data['config_key']], $data);
        }
    }
}