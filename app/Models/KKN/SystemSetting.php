<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;

class SystemSetting extends Model
{
    use HasFactory;

    protected $connection = 'kkn';
    protected $table = 'system_settings';

    /**
     * Config keys that contain sensitive values and are encrypted in DB.
     */
    private const SECRET_KEYS = [
        'master_api_client_secret',
        'master_api_token',
        'gemini_api_key',
        'storage_secret',
    ];

    protected $fillable = [
        'config_key',
        'label',
        'value',
        'type',
        'group',
    ];

    /**
     * Get a setting value by key with caching. Decrypts secret values automatically.
     */
    public static function get(string $key, $default = null)
    {
        return Cache::remember("system_setting_{$key}", now()->addHours(24), function () use ($key, $default) {
            try {
                if (!\Illuminate\Support\Facades\Schema::connection('kkn')->hasTable('system_settings')) {
                    return $default;
                }
                $setting = self::where('config_key', $key)->first();
                if (!$setting) {
                    return $default;
                }
                $value = $setting->value;
                // Decrypt secret values
                if (in_array($key, self::SECRET_KEYS) && $value) {
                    try {
                        $value = Crypt::decryptString($value);
                    } catch (\Illuminate\Contracts\Encryption\DecryptException $e) {
                        // Value stored before encryption was added; return as-is
                    }
                }
                return $value;
            }
            catch (\Exception $e) {
                return $default;
            }
        });
    }

    /**
     * Set a setting value by key and clear cache.
     */
    public static function set(string $key, $value): void
    {
        // Encrypt secret values before storing
        $storedValue = $value;
        if (in_array($key, self::SECRET_KEYS) && $value) {
            $storedValue = Crypt::encryptString($value);
        }

        $setting = self::where('config_key', $key)->first();
        if ($setting) {
            $setting->update(['value' => $storedValue]);
        }
        else {
            self::create([
                'config_key' => $key,
                'label' => ucwords(str_replace('_', ' ', $key)),
                'value' => $storedValue,
            ]);
        }
        Cache::forget("system_setting_{$key}");
    }
}