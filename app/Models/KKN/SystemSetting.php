<?php

namespace App\Models\KKN;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SystemSetting extends Model
{
    use HasFactory;

    protected $connection = 'kkn';
    protected $table = 'system_settings';

    protected $fillable = [
        'config_key',
        'label',
        'value',
        'type',
        'group',
    ];

    /**
     * Get a setting value by key with caching.
     */
    public static function get(string $key, $default = null)
    {
        return Cache::remember("system_setting_{$key}", now()->addHours(24), function () use ($key, $default) {
            $setting = self::where('config_key', $key)->first();
            return $setting ? $setting->value : $default;
        });
    }

    /**
     * Set a setting value by key and clear cache.
     */
    public static function set(string $key, $value): void
    {
        $setting = self::where('config_key', $key)->first();
        if ($setting) {
            $setting->update(['value' => $value]);
        }
        else {
            self::create([
                'config_key' => $key,
                'label' => ucwords(str_replace('_', ' ', $key)),
                'value' => $value,
            ]);
        }
        Cache::forget("system_setting_{$key}");
    }
}