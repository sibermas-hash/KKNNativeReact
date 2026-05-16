<?php

declare(strict_types=1);

namespace App\Services\AI;

/**
 * Shared trait for 5-tier AI failover across all AI services.
 *
 * Tier order:
 *   1. Primary gateway
 *   2. Fallback gateway
 *   3. Tertiary gateway
 *   4. Direct Gemini API
 *   5. Direct OpenAI API
 *
 * If the configured gateway token is exhausted, tiers 1-3 fail fast and
 * 4-5 take over.
 */
trait HasAiFailover
{
    protected function loadAiTiers(): array
    {
        $tiers = [];

        // Tier 1-3: via configured OpenAI-compatible gateway
        $primary = config('ai.failover.primary');
        if (! empty($primary['key'])) {
            $tiers[] = ['label' => 'primary-gateway', 'url' => $primary['url'], 'key' => $primary['key'], 'model' => $primary['model']];
        }

        $fallback = config('ai.failover.fallback');
        if (! empty($fallback['key'])) {
            $tiers[] = ['label' => 'fallback-gateway', 'url' => $fallback['url'], 'key' => $fallback['key'], 'model' => $fallback['model']];
        }

        $tertiary = config('ai.failover.tertiary');
        if (! empty($tertiary['key'])) {
            $tiers[] = ['label' => 'tertiary-gateway', 'url' => $tertiary['url'], 'key' => $tertiary['key'], 'model' => $tertiary['model']];
        }

        // Tier 4-5: direct provider APIs (bypass gateway)
        $directGemini = config('ai.failover.direct_gemini');
        if (! empty($directGemini['key'])) {
            $tiers[] = ['label' => 'direct-gemini', 'url' => $directGemini['url'], 'key' => $directGemini['key'], 'model' => $directGemini['model']];
        }

        $directOpenai = config('ai.failover.direct_openai');
        if (! empty($directOpenai['key'])) {
            $tiers[] = ['label' => 'direct-openai', 'url' => $directOpenai['url'], 'key' => $directOpenai['key'], 'model' => $directOpenai['model']];
        }

        return $tiers;
    }
}
