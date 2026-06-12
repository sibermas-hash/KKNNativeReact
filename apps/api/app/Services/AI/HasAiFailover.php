<?php

declare(strict_types=1);

namespace App\Services\AI;

use App\Models\KKN\SystemSetting;

/**
 * Shared trait for Rizquna-only AI failover across all AI services.
 *
 * Tier order:
 *   1. Primary gateway
 *   2. Fallback gateway
 *   3. Tertiary gateway
 *
 * Seluruh tier default ke Rizquna Router, tetapi dapat memakai key/model
 * berbeda untuk retry yang terisolasi.
 */
trait HasAiFailover
{
    protected function loadAiTiers(?string $preferredModel = null, bool $forcePreferredModel = false): array
    {
        return array_values($this->loadAiTierMap($preferredModel, $forcePreferredModel));
    }

    /**
     * @return array<string, array{label: string, url: string, key: string, model: string}>
     */
    protected function loadAiTierMap(?string $preferredModel = null, bool $forcePreferredModel = false): array
    {
        $defaultUrl = $this->firstFilledString(
            SystemSetting::get('rizquna_url', null),
            config('ai.providers.rizquna.url'),
            'https://router.rizquna.id/v1'
        ) ?? 'https://router.rizquna.id/v1';

        $defaultKey = $this->stringValue(
            $this->preferExplicitSetting(
                SystemSetting::get('rizquna_api_key', null),
                config('ai.providers.rizquna.key')
            )
        ) ?? '';

        $defaultModel = $this->firstFilledString(
            $preferredModel,
            SystemSetting::get('ai_model', null),
            config('ai.providers.rizquna.models.text.default'),
            'ag/gemini-3-flash'
        ) ?? 'ag/gemini-3-flash';

        return [
            'primary' => $this->resolveTier(
                'primary',
                'primary-gateway',
                $defaultUrl,
                $defaultKey,
                $defaultModel,
                $forcePreferredModel
            ),
            'fallback' => $this->resolveTier(
                'fallback',
                'fallback-gateway',
                $defaultUrl,
                $defaultKey,
                $defaultModel,
                $forcePreferredModel
            ),
            'tertiary' => $this->resolveTier(
                'tertiary',
                'tertiary-gateway',
                $defaultUrl,
                $defaultKey,
                $defaultModel,
                $forcePreferredModel
            ),
        ];
    }

    /**
     * @return array{label: string, url: string, key: string, model: string}
     */
    private function resolveTier(
        string $tierKey,
        string $label,
        string $defaultUrl,
        string $defaultKey,
        string $defaultModel,
        bool $forcePreferredModel
    ): array {
        $tierConfig = (array) config("ai.failover.{$tierKey}", []);

        $url = $this->firstFilledString(
            SystemSetting::get("ai_{$tierKey}_url", null),
            $tierConfig['url'] ?? null,
            $defaultUrl
        ) ?? $defaultUrl;

        $key = $this->stringValue(
            $this->preferExplicitSetting(
                SystemSetting::get("ai_{$tierKey}_key", null),
                $tierConfig['key'] ?? null,
                $defaultKey
            )
        ) ?? '';

        $configuredTierModel = $this->firstFilledString(
            SystemSetting::get("ai_{$tierKey}_model", null),
            $tierConfig['model'] ?? null
        );

        $model = $forcePreferredModel
            ? $defaultModel
            : ($configuredTierModel ?? $defaultModel);

        return [
            'label' => $label,
            'url' => $url,
            'key' => $key,
            'model' => $model,
        ];
    }

    private function preferExplicitSetting(mixed ...$values): mixed
    {
        foreach ($values as $value) {
            if ($value !== null && ! is_array($value) && ! is_object($value)) {
                return $value;
            }
        }

        return null;
    }

    private function firstFilledString(mixed ...$values): ?string
    {
        foreach ($values as $value) {
            $string = $this->stringValue($value);
            if ($string !== null && $string !== '') {
                return $string;
            }
        }

        return null;
    }

    private function stringValue(mixed $value): ?string
    {
        if ($value === null || is_array($value) || is_object($value)) {
            return null;
        }

        return trim((string) $value);
    }
}
