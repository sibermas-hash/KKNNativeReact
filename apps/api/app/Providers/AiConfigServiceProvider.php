<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\KKN\SystemSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AiConfigServiceProvider extends ServiceProvider
{
    public const RUNTIME_CONFIG_CACHE_KEY = 'ai_runtime_config';

    /**
     * @var array<string, string|array<int, string>>
     */
    private const PROVIDER_SETTING_MAP = [
        'anthropic_api_key' => 'ai.providers.anthropic.key',
        'anthropic_url' => 'ai.providers.anthropic.url',
        'azure_openai_api_key' => 'ai.providers.azure.key',
        'azure_openai_url' => 'ai.providers.azure.url',
        'azure_openai_api_version' => 'ai.providers.azure.api_version',
        'azure_openai_deployment' => 'ai.providers.azure.deployment',
        'azure_openai_embedding_deployment' => 'ai.providers.azure.embedding_deployment',
        'cohere_api_key' => 'ai.providers.cohere.key',
        'deepseek_api_key' => 'ai.providers.deepseek.key',
        'gemini_api_key' => 'ai.providers.gemini.key',
        'gemini_url' => 'ai.providers.gemini.url',
        'groq_api_key' => 'ai.providers.groq.key',
        'groq_url' => 'ai.providers.groq.url',
        'mistral_api_key' => 'ai.providers.mistral.key',
        'mistral_url' => 'ai.providers.mistral.url',
        'ollama_api_key' => 'ai.providers.ollama.key',
        'ollama_base_url' => 'ai.providers.ollama.url',
        'openai_api_key' => 'ai.providers.openai.key',
        'openai_url' => 'ai.providers.openai.url',
        'rizquna_api_key' => 'ai.providers.rizquna.key',
        'rizquna_url' => 'ai.providers.rizquna.url',
        'rizquna_model' => 'ai.providers.rizquna.models.text.default',
        'rizquna_vision_model' => 'ai.providers.rizquna.models.vision.default',
        'rizquna_code_model' => 'ai.providers.rizquna.models.code.default',
        'xai_api_key' => 'ai.providers.xai.key',
        'xai_url' => 'ai.providers.xai.url',
    ];

    /**
     * @var array<string, string|array<int, string>>
     */
    private const FAILOVER_SETTING_MAP = [
        'ai_primary_url' => 'ai.failover.primary.url',
        'ai_primary_key' => 'ai.failover.primary.key',
        'ai_primary_model' => 'ai.failover.primary.model',
        'ai_fallback_url' => 'ai.failover.fallback.url',
        'ai_fallback_key' => 'ai.failover.fallback.key',
        'ai_fallback_model' => 'ai.failover.fallback.model',
        'ai_tertiary_url' => 'ai.failover.tertiary.url',
        'ai_tertiary_key' => 'ai.failover.tertiary.key',
        'ai_tertiary_model' => 'ai.failover.tertiary.model',
    ];

    /**
     * @var array<string, string|array<int, string>>
     */
    private const ROUTING_SETTING_MAP = [
        'ai_assistant_provider' => 'ai.routing.assistant.provider',
        'ai_assistant_model' => 'ai.routing.assistant.model',
        'ai_activity_reviewer_provider' => 'ai.routing.activity_reviewer.provider',
        'ai_activity_reviewer_model' => 'ai.routing.activity_reviewer.model',
        'ai_alerting_model' => 'ai.routing.alerting.model',
        'ai_analysis_model' => 'ai.routing.analysis.model',
        'ai_code_provider' => 'ai.routing.code.provider',
        'ai_code_model' => [
            'ai.routing.code.model',
            'ai.providers.rizquna.models.code.default',
        ],
        'ai_digest_model' => 'ai.routing.digest.model',
        'ai_self_healer_provider' => 'ai.routing.self_healer.provider',
        'ai_self_healer_model' => 'ai.routing.self_healer.model',
        'ai_vision_model' => [
            'ai.routing.vision.model',
            'ai.providers.rizquna.models.vision.default',
        ],
    ];

    /**
     * @var array<int, string>
     */
    private const LEGACY_MODEL_TARGETS = [
        'ai.providers.rizquna.models.text.default',
        'ai.routing.assistant.model',
        'ai.routing.analysis.model',
        'ai.routing.activity_reviewer.model',
        'ai.failover.primary.model',
    ];

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
        $this->bootstrapAiConfig();
    }

    /**
     * Bootstrap AI configuration from database with fallback to .env.
     *
     * Priority:
     * 1. Database (SystemSetting) - runtime override
     * 2. .env/config - bootstrap default
     */
    private function bootstrapAiConfig(): void
    {
        // Local dev/test builds must boot fast and independently from runtime
        // system_settings reads. In localbuild the app often talks to production
        // through an SSH tunnel; querying settings during every HTTP bootstrap
        // can stall unrelated routes (captcha/login) when the tunnel/DB is slow.
        if ($this->app->environment(['localbuild', 'testing'])) {
            return;
        }

        if (! $this->isDatabaseReady()) {
            return;
        }

        $this->loadAiRuntimeConfig();
    }

    /**
     * Check if database and system_settings table are ready.
     */
    private function isDatabaseReady(): bool
    {
        try {
            return \DB::connection()->getDatabaseName() !== null
                && Schema::hasTable('system_settings');
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Load AI runtime configuration from database.
     */
    private function loadAiRuntimeConfig(): void
    {
        try {
            $overrides = Cache::remember(self::RUNTIME_CONFIG_CACHE_KEY, 3600, function (): array {
                return $this->buildRuntimeConfig();
            });
        } catch (\Throwable) {
            // Artisan bootstrap (route:cache/config:cache) must not hard-fail when
            // the configured cache backend is unavailable/missing locally (e.g.
            // redis store without phpredis). Fall back to uncached DB reads.
            try {
                $overrides = $this->buildRuntimeConfig();
            } catch (\Throwable) {
                $overrides = [];
            }
        }

        if ($overrides !== []) {
            config($overrides);
        }
    }

    /**
     * Build config() dot-key overrides from database-backed system settings.
     *
     * @return array<string, mixed>
     */
    private function buildRuntimeConfig(): array
    {
        $overrides = [];
        $defaultProvider = $this->settingValue('ai_provider');

        if ($defaultProvider !== null && $defaultProvider !== '') {
            $overrides['ai.default'] = $defaultProvider;
            $overrides['ai.default_for_images'] = $defaultProvider;
            $overrides['ai.default_for_audio'] = $defaultProvider;
            $overrides['ai.default_for_transcription'] = $defaultProvider;
            $overrides['ai.default_for_embeddings'] = $defaultProvider;
            $overrides['ai.default_for_reranking'] = $defaultProvider;
        }

        $this->applyConfigMap($overrides, self::PROVIDER_SETTING_MAP);

        $legacyModel = $this->settingValue('ai_model');
        if ($legacyModel !== null && $legacyModel !== '') {
            foreach (self::LEGACY_MODEL_TARGETS as $target) {
                $overrides[$target] = $legacyModel;
            }
        }

        $this->applyConfigMap($overrides, self::FAILOVER_SETTING_MAP);
        $this->applyConfigMap($overrides, self::ROUTING_SETTING_MAP);

        return $overrides;
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @param  array<string, string|array<int, string>>  $settingMap
     */
    private function applyConfigMap(array &$overrides, array $settingMap): void
    {
        foreach ($settingMap as $settingKey => $configKeys) {
            $value = $this->settingValue($settingKey);
            if ($value === null) {
                continue;
            }

            $allowBlank = str_ends_with($settingKey, '_key');
            if (! $allowBlank && $value === '') {
                continue;
            }

            foreach ((array) $configKeys as $configKey) {
                $overrides[$configKey] = $value;
            }
        }
    }

    private function settingValue(string $key): ?string
    {
        $value = SystemSetting::get($key, null);
        if ($value === null) {
            return null;
        }

        if (is_array($value) || is_object($value)) {
            return null;
        }

        return trim((string) $value);
    }
}
