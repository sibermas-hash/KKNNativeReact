<?php

declare(strict_types=1);

namespace App\Services\AI;

/**
 * Shared trait for 5-tier AI failover across all AI services.
 *
 * Tier order:
 *   1. SumoPod primary (gemini-2.5-pro)
 *   2. SumoPod fallback (gemini-2.5-flash)
 *   3. SumoPod tertiary (gpt-4o)
 *   4. Direct Gemini API (bypass SumoPod)
 *   5. Direct OpenAI API (bypass SumoPod)
 *
 * If SumoPod token is exhausted, tiers 1-3 fail fast and 4-5 take over.
 */
trait HasAiFailover
{
    protected function loadAiTiers(): array
    {
        $tiers = [];

        // Tier 1-3: via SumoPod gateway
        $primary = config('ai.failover.primary');
        if (!empty($primary['key'])) {
            $tiers[] = ['label' => 'sumopod-primary', 'url' => $primary['url'], 'key' => $primary['key'], 'model' => $primary['model']];
        }

        $fallback = config('ai.failover.fallback');
        if (!empty($fallback['key'])) {
            $tiers[] = ['label' => 'sumopod-fallback', 'url' => $fallback['url'], 'key' => $fallback['key'], 'model' => $fallback['model']];
        }

        $tertiary = config('ai.failover.tertiary');
        if (!empty($tertiary['key'])) {
            $tiers[] = ['label' => 'sumopod-tertiary', 'url' => $tertiary['url'], 'key' => $tertiary['key'], 'model' => $tertiary['model']];
        }

        // Tier 4-5: direct provider APIs (bypass SumoPod)
        $directGemini = config('ai.failover.direct_gemini');
        if (!empty($directGemini['key'])) {
            $tiers[] = ['label' => 'direct-gemini', 'url' => $directGemini['url'], 'key' => $directGemini['key'], 'model' => $directGemini['model']];
        }

        $directOpenai = config('ai.failover.direct_openai');
        if (!empty($directOpenai['key'])) {
            $tiers[] = ['label' => 'direct-openai', 'url' => $directOpenai['url'], 'key' => $directOpenai['key'], 'model' => $directOpenai['model']];
        }

        return $tiers;
    }
}
