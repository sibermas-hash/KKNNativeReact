<?php

declare(strict_types=1);

namespace App\Models\KKN;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Schema;

class SystemSetting extends Model
{
    private const AI_RUNTIME_CONFIG_CACHE_KEY = 'ai_runtime_config';

    protected $table = 'system_settings';

    protected $fillable = [
        'config_key',
        'label',
        'value',
        'type',
        'group',
    ];

    use HasFactory;

    /**
     * Config keys that contain sensitive values and are encrypted in DB.
     */
    private const SECRET_KEYS = [
        'master_api_client_secret',
        'master_api_token',
        'rizquna_api_key',
        'gemini_api_key',
        'openai_api_key',
        'anthropic_api_key',
        'azure_openai_api_key',
        'groq_api_key',
        'mistral_api_key',
        'deepseek_api_key',
        'cohere_api_key',
        'xai_api_key',
        'ollama_api_key',
        'ai_primary_key',
        'ai_fallback_key',
        'ai_tertiary_key',
        'storage_secret',
        'wa_gateway_api_key',
    ];

    /**
     * Get a setting value by key with caching. Decrypts secret values automatically.
     */
    public static function get(string $key, $default = null)
    {
        try {
            return Cache::remember("system_setting_{$key}", now()->addHours(24), function () use ($key, $default) {
                if (! Schema::hasTable('system_settings')) {
                    return $default;
                }
                $setting = self::where('config_key', $key)->first();
                if (! $setting) {
                    return $default;
                }
                $value = $setting->value;
                // Decrypt secret values
                if (in_array($key, self::SECRET_KEYS) && $value) {
                    try {
                        $value = Crypt::decryptString($value);
                    } catch (DecryptException $e) {
                        // Value stored before encryption was added; return as-is
                    }
                }

                return $value;
            });
        } catch (\Throwable $e) {
            return $default;
        }
    }

    /**
     * Set a setting value by key and clear cache.
     */
    public static function set(string $key, $value): void
    {
        // SECURITY: Explicitly cast to string to prevent type confusion
        $stringValue = $value !== null ? (string) $value : '';
        $isAiRelated = self::isAiRelatedKey($key);

        // Encrypt secret values before storing
        $storedValue = $stringValue;
        if (in_array($key, self::SECRET_KEYS) && $stringValue !== '') {
            $storedValue = Crypt::encryptString($stringValue);
        }

        $setting = self::where('config_key', $key)->first();
        $attributes = ['value' => $storedValue];
        if ($isAiRelated) {
            $attributes['group'] = 'ai_settings';
        }

        if ($setting) {
            $setting->update($attributes);
        } else {
            $payload = [
                'config_key' => $key,
                'label' => ucwords(str_replace('_', ' ', $key)),
                'value' => $storedValue,
            ];
            if ($isAiRelated) {
                $payload['group'] = 'ai_settings';
            }

            self::create($payload);
        }

        Cache::forget("system_setting_{$key}");
        if ($isAiRelated) {
            Cache::forget(self::AI_RUNTIME_CONFIG_CACHE_KEY);
        }
    }

    private static function isAiRelatedKey(string $key): bool
    {
        if (str_starts_with($key, 'ai_')) {
            return true;
        }

        return in_array($key, [
            'anthropic_api_key',
            'anthropic_url',
            'azure_openai_api_key',
            'azure_openai_api_version',
            'azure_openai_deployment',
            'azure_openai_embedding_deployment',
            'azure_openai_url',
            'cohere_api_key',
            'deepseek_api_key',
            'gemini_api_key',
            'gemini_url',
            'groq_api_key',
            'groq_url',
            'mistral_api_key',
            'mistral_url',
            'ollama_api_key',
            'ollama_base_url',
            'openai_api_key',
            'openai_url',
            'rizquna_api_key',
            'rizquna_url',
            'rizquna_model',
            'rizquna_vision_model',
            'rizquna_code_model',
            'xai_api_key',
            'xai_url',
        ], true);
    }
}
