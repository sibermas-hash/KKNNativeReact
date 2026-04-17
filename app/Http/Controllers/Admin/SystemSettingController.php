<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\SystemSetting;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
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
        Gate::authorize('manage-settings');
        $this->initializeDefaults();

        $settings = SystemSetting::query()->whereIn('group', ['master_api', 'general', 'ai_settings', 'storage_settings', 'registration_rules', 'content_settings'])->get();

        // Mask secret values for display (only show last 4 chars)
        // But keep original value for editing - FE will handle masking on input focus
        $settings->transform(function ($setting) {
            if (in_array($setting->config_key, self::SECRET_KEYS) && $setting->value) {
                try {
                    $decrypted = Crypt::decryptString($setting->value);
                    $setting->masked_value = str_repeat('*', max(0, strlen($decrypted) - 4)).substr($decrypted, -4);
                    $setting->is_secret = true;
                    // Keep original decrypted value for form editing
                    $setting->value = $decrypted;
                } catch (DecryptException $e) {
                    $setting->masked_value = '********';
                    $setting->is_secret = true;
                    $setting->value = '';
                }
            }

            return $setting;
        });

        $geminiKey = SystemSetting::where('config_key', 'gemini_api_key')->first();
        $hasKey = $geminiKey && ! empty($geminiKey->value);

        $aiStatus = [
            'provider' => 'GEMINI GOOGLE AI',
            'is_healthy' => $hasKey,
            'endpoint' => 'generativelanguage.googleapis.com',
            'model_text' => 'gemini-1.5-flash / pro',
            'last_check' => now()->toIso8601String(),
        ];

        $aiUsage = [
            'total_prompts' => Cache::get('ai_usage_total', 0),
            'successful_heals' => Cache::get('ai_heals_total', 0),
        ];

        return Inertia::render('Admin/System/Settings/System', [
            'settings' => $settings->groupBy('group'),
            'title' => 'Pengaturan Sistem & API',
            'ai_status' => $aiStatus,
            'ai_usage' => $aiUsage,
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
            $setting = $settingModels->get($item['id']);
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
                'value' => config('services.master_api.token'),
                'type' => 'password',
                'group' => 'master_api',
            ],
            [
                'config_key' => 'support_contact_label',
                'label' => 'Label Kontak Bantuan Login',
                'value' => 'Admin KKN / LPPM',
                'type' => 'text',
                'group' => 'general',
            ],
            [
                'config_key' => 'support_whatsapp_number',
                'label' => 'Nomor WhatsApp Bantuan Login',
                'value' => env('SUPPORT_WHATSAPP_NUMBER'),
                'type' => 'text',
                'group' => 'general',
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
            [
                'config_key' => 'daily_report_geo_radius_meters',
                'label' => 'Radius Validasi GPS Laporan Harian (Meter)',
                'value' => '5000',
                'type' => 'text',
                'group' => 'registration_rules',
            ],
            [
                'config_key' => 'daily_report_geo_max_accuracy_meters',
                'label' => 'Batas Maksimal Akurasi GPS Laporan Harian (Meter)',
                'value' => '250',
                'type' => 'text',
                'group' => 'registration_rules',
            ],
            [
                'config_key' => 'site_about',
                'label' => 'Tentang LPPM (About)',
                'value' => 'Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) UIN Profesor Kiai Haji Saifuddin Zuhri Purwokerto.',
                'type' => 'textarea',
                'group' => 'content_settings',
            ],
            [
                'config_key' => 'site_visi',
                'label' => 'Visi LPPM',
                'value' => 'Menjadi pusat unggulan penelitian dan pengabdian masyarakat berbasis kearifan lokal.',
                'type' => 'textarea',
                'group' => 'content_settings',
            ],
            [
                'config_key' => 'site_misi',
                'label' => 'Misi LPPM',
                'value' => 'Mengembangkan riset aplikatif dan pengabdian masyarakat yang terukur.',
                'type' => 'textarea',
                'group' => 'content_settings',
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
            'daily_report_geo_radius_meters' => ['nullable', 'integer', 'min:100', 'max:50000'],
            'daily_report_geo_max_accuracy_meters' => ['nullable', 'integer', 'min:10', 'max:5000'],
            'support_contact_label' => ['nullable', 'string', 'max:100'],
            'support_whatsapp_number' => ['nullable', 'string', 'max:30'],
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

    public function testAiConnection(Request $request)
    {
        $request->validate([
            'gemini_api_key' => 'required|string',
        ]);

        $apiKey = $request->input('gemini_api_key');

        try {
            $response = Http::timeout(10)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => 'ping'],
                            ],
                        ],
                    ],
                ]);

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Koneksi berhasil',
                    'model' => 'gemini-1.5-flash',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'API Key tidak valid atau ditolak oleh Google AI.',
                'error_code' => 'API_REJECTED',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghubungi server Google AI.',
                'error_code' => 'NETWORK_ERROR',
            ]);
        }
    }

    public function updateAiSettings(Request $request)
    {
        $request->validate([
            'gemini_api_key' => 'nullable|string',
            'ai_enabled' => 'required|in:0,1,true,false',
        ]);

        if ($request->filled('gemini_api_key')) {
            $apiKeySetting = \App\Models\Master\SystemSetting::where('config_key', 'gemini_api_key')->first();
            if ($apiKeySetting) {
                $apiKeySetting->update([
                    'value' => Crypt::encryptString($request->input('gemini_api_key')),
                ]);
                Cache::forget('system_setting_gemini_api_key');
            }
        }

        $enabledSetting = \App\Models\Master\SystemSetting::where('config_key', 'ai_enabled')->first();
        if ($enabledSetting) {
            $val = in_array($request->input('ai_enabled'), [1, '1', true, 'true'], true) ? '1' : '0';
            $enabledSetting->update(['value' => $val]);
            Cache::forget('system_setting_ai_enabled');
        }

        return redirect()->back()->with('success', 'Konfigurasi AI berhasil diperbarui.');
    }

    public function removeAiKey(Request $request)
    {
        $apiKeySetting = \App\Models\Master\SystemSetting::where('config_key', 'gemini_api_key')->first();
        if ($apiKeySetting) {
            $apiKeySetting->update(['value' => null]);
            Cache::forget('system_setting_gemini_api_key');
        }

        return redirect()->back()->with('success', 'API Key Gemini berhasil dihapus secara permanen.');
    }
}
