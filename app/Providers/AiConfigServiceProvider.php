<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\KKN\SystemSetting;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\ServiceProvider;

class AiConfigServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Load AI configuration from database (production) or .env (development)
        // This runs after database is ready
        $this->bootstrapAiConfig();
    }

    /**
     * Bootstrap AI configuration from database with fallback to .env
     *
     * Priority:
     * 1. Database (SystemSetting) - Production config
     * 2. .env - Development/initial setup
     * 3. null - Use default
     *
     * Benefits:
     * - Production: No .env needed, all config in database via admin panel
     * - Development: Can use .env for quick testing
     * - No restart needed: Cache invalidation on update
     */
    private function bootstrapAiConfig(): void
    {
        if (! $this->app->runningInConsole() && $this->isDatabaseReady()) {
            $this->loadAiProviderConfig();
        }
    }

    /**
     * Check if database is ready (avoid errors during migrations)
     */
    private function isDatabaseReady(): bool
    {
        try {
            return \DB::connection()->getDatabaseName() !== null;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Load AI provider configuration from database
     */
    private function loadAiProviderConfig(): void
    {
        // Cache key: ai_config (cached for 1 hour, invalidated on update)
        $cachedConfig = Cache::remember('ai_provider_config', 3600, function () {
            return $this->fetchProviderConfigFromDatabase();
        });

        if ($cachedConfig) {
            // Merge database config with existing config
            $currentAiConfig = config('ai.providers', []);
            $updatedConfig = array_merge_recursive($currentAiConfig, $cachedConfig);

            // Update the ai.providers config at runtime
            config(['ai.providers' => $updatedConfig]);
            config(['ai.default' => $this->getDefaultProvider()]);
        }
    }

    /**
     * Fetch AI provider configuration from database
     *
     * @return array<string, array>
     */
    private function fetchProviderConfigFromDatabase(): array
    {
        $config = [];

        // Get all AI-related settings from database
        $settings = SystemSetting::where('group', 'ai_settings')
            ->orWhere('config_key', 'like', '%_api_key')
            ->orWhere('config_key', 'like', '%_api_%')
            ->get();

        if ($settings->isEmpty()) {
            return [];
        }

        foreach ($settings as $setting) {
            $value = $setting->value;

            // Decrypt if encrypted
            if ($this->isSecretKey($setting->config_key) && $value) {
                try {
                    $value = Crypt::decryptString($value);
                } catch (DecryptException $e) {
                    \Log::warning("Failed to decrypt AI setting: {$setting->config_key}", [
                        'error' => $e->getMessage(),
                    ]);
                    continue;
                }
            }

            // Map database keys to config structure
            $config = $this->mapDatabaseKeyToConfig($config, $setting->config_key, $value);
        }

        return $config;
    }

    /**
     * Map database key to config structure
     *
     * Examples:
     * - 'gemini_api_key' -> ['gemini' => ['key' => value]]
     * - 'openai_api_key' -> ['openai' => ['key' => value]]
     * - 'anthropic_api_key' -> ['anthropic' => ['key' => value]]
     *
     * @param  array<string, array>  $config
     * @param  string  $dbKey
     * @param  mixed  $value
     * @return array<string, array>
     */
    private function mapDatabaseKeyToConfig(array $config, string $dbKey, mixed $value): array
    {
        // Extract provider name and setting type from key
        // Examples: 'gemini_api_key', 'openai_api_key', 'anthropic_api_key'
        if (str_ends_with($dbKey, '_api_key')) {
            $provider = str_replace('_api_key', '', $dbKey);

            // Provider exists in config, update its key
            if ($value) {
                $config[$provider] ??= [];
                $config[$provider]['key'] = $value;
            }
        }
        // For provider-specific settings (URL, deployment, etc)
        elseif (str_contains($dbKey, '_')) {
            $parts = explode('_', $dbKey);
            if (count($parts) >= 2) {
                $provider = array_shift($parts); // First part is provider
                $configKey = implode('_', $parts); // Rest is config key

                if ($value) {
                    $config[$provider] ??= [];
                    $config[$provider][$configKey] = $value;
                }
            }
        }

        return $config;
    }

    /**
     * Check if key should be encrypted/decrypted
     */
    private function isSecretKey(string $key): bool
    {
        $secretKeys = [
            'gemini_api_key',
            'openai_api_key',
            'anthropic_api_key',
            'azure_openai_api_key',
            'groq_api_key',
            'mistral_api_key',
            'deepseek_api_key',
            'cohere_api_key',
            'xai_api_key',
            'alibaba_api_key',
            'master_api_client_secret',
            'master_api_token',
        ];

        return in_array($key, $secretKeys, true);
    }

    /**
     * Get default provider from database or .env
     */
    private function getDefaultProvider(): string
    {
        // Try database first
        if ($this->isDatabaseReady()) {
            $setting = SystemSetting::where('config_key', 'ai_provider')->first();
            if ($setting && $setting->value) {
                return $setting->value;
            }
        }

        // Fallback to .env
        return env('AI_PROVIDER', 'gemini');
    }
}
