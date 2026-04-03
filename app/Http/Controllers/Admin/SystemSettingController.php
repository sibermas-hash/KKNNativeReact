<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\SystemSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;
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
        Gate::authorize('manage-settings');
        $this->initializeDefaults();

        $settings = SystemSetting::whereIn('group', ['master_api', 'general', 'ai_settings', 'storage_settings', 'registration_rules'])->get();

        // Mask secret values for display (only show last 4 chars)
        $settings->transform(function ($setting) {
            if (in_array($setting->config_key, self::SECRET_KEYS) && $setting->value) {
                try {
                    $decrypted = Crypt::decryptString($setting->value);
                    $setting->value = str_repeat('*', max(0, strlen($decrypted) - 4)) . substr($decrypted, -4);
                    $setting->is_secret = true;
                } catch (\Illuminate\Contracts\Encryption\DecryptException $e) {
                    $setting->value = '********';
                    $setting->is_secret = true;
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
        Gate::authorize('manage-settings');

        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.id' => 'required|exists:kkn.system_settings,id',
            'settings.*.value' => 'nullable|string',
        ]);

        $indexedSettings = collect($validated['settings'])->values();
        $settingModels = SystemSetting::query()
            ->whereIn('id', $indexedSettings->pluck('id'))
            ->get()
            ->keyBy('id');

        $valueIndexByKey = [];

        foreach ($indexedSettings as $index => $item) {
            $setting = $settingModels->get($item['id']);
            if (! $setting) {
                continue;
            }

            $this->validateSettingValue($setting, (string) ($item['value'] ?? ''), $index);
            $valueIndexByKey[$setting->config_key] = $index;
        }

        $minKey = 'group_male_min_ratio';
        $targetKey = 'group_male_target_ratio';
        if (isset($valueIndexByKey[$minKey], $valueIndexByKey[$targetKey])) {
            $minValue = (float) ($indexedSettings[$valueIndexByKey[$minKey]]['value'] ?? 0);
            $targetValue = (float) ($indexedSettings[$valueIndexByKey[$targetKey]]['value'] ?? 0);

            if ($targetValue < $minValue) {
                throw ValidationException::withMessages([
                    "settings.{$valueIndexByKey[$targetKey]}.value" => 'Target ideal laki-laki harus lebih besar atau sama dengan minimum laki-laki.',
                ]);
            }
        }

        foreach ($indexedSettings as $item) {
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
            [
                'config_key' => 'cooling_period_hours',
                'label' => 'Cooling Period Keluar Kelompok (Jam)',
                'value' => '24',
                'type' => 'text',
                'group' => 'registration_rules',
            ],
            [
                'config_key' => 'max_group_moves',
                'label' => 'Maksimal Pindah Kelompok',
                'value' => '2',
                'type' => 'text',
                'group' => 'registration_rules',
            ],
            [
                'config_key' => 'group_leave_penalty_points',
                'label' => 'Penalti Keluar Kelompok',
                'value' => '10',
                'type' => 'text',
                'group' => 'registration_rules',
            ],
            [
                'config_key' => 'group_lock_days_before_start',
                'label' => 'Kunci Keluar Kelompok Sebelum Pelaksanaan (Hari)',
                'value' => '7',
                'type' => 'text',
                'group' => 'registration_rules',
            ],
            [
                'config_key' => 'registration_snapshot_cache_seconds',
                'label' => 'Cache Snapshot Portal Pendaftaran (Detik)',
                'value' => '3',
                'type' => 'text',
                'group' => 'registration_rules',
            ],
            [
                'config_key' => 'registration_lock_ttl_seconds',
                'label' => 'Masa Hidup Lock Pendaftaran (Detik)',
                'value' => '8',
                'type' => 'text',
                'group' => 'registration_rules',
            ],
            [
                'config_key' => 'registration_lock_wait_seconds',
                'label' => 'Waktu Tunggu Lock Pendaftaran (Detik)',
                'value' => '6',
                'type' => 'text',
                'group' => 'registration_rules',
            ],
            [
                'config_key' => 'group_male_min_ratio',
                'label' => 'Minimum Persentase Laki-laki per Kelompok',
                'value' => '20',
                'type' => 'text',
                'group' => 'registration_rules',
            ],
            [
                'config_key' => 'group_male_target_ratio',
                'label' => 'Target Ideal Persentase Laki-laki per Kelompok',
                'value' => '30',
                'type' => 'text',
                'group' => 'registration_rules',
            ],
        ];

        foreach ($defaults as $data) {
            // Encrypt secret values before storing
            if (in_array($data['config_key'], self::SECRET_KEYS) && $data['value']) {
                $data['value'] = Crypt::encryptString($data['value']);
            }
            SystemSetting::firstOrCreate(['config_key' => $data['config_key']], $data);
        }
    }

    private function validateSettingValue(SystemSetting $setting, string $value, int $index): void
    {
        $rules = [
            'cooling_period_hours' => ['nullable', 'integer', 'min:0', 'max:720'],
            'max_group_moves' => ['nullable', 'integer', 'min:0', 'max:20'],
            'group_leave_penalty_points' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'group_lock_days_before_start' => ['nullable', 'integer', 'min:0', 'max:60'],
            'registration_snapshot_cache_seconds' => ['nullable', 'integer', 'min:1', 'max:30'],
            'registration_lock_ttl_seconds' => ['nullable', 'integer', 'min:3', 'max:30'],
            'registration_lock_wait_seconds' => ['nullable', 'integer', 'min:1', 'max:10'],
            'group_male_min_ratio' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'group_male_target_ratio' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];

        if (! isset($rules[$setting->config_key])) {
            return;
        }

        $validator = validator(
            ['value' => $value],
            ['value' => $rules[$setting->config_key]],
            [],
            ['value' => $setting->label]
        );

        if ($validator->fails()) {
            throw ValidationException::withMessages([
                "settings.{$index}.value" => $validator->errors()->first('value'),
            ]);
        }
    }
}
