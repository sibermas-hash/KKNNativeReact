<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Laravel\Ai\Ai;
use Inertia\Inertia;
use Inertia\Response;

class AiStatusController extends Controller
{
    public function index(): Response
    {
        $provider = config('ai.default', 'alibaba');
        $config = config("ai.providers.{$provider}");

        // Test connection health
        $isHealthy = Cache::remember('ai_health_status', 300, function () use ($provider) {
            try {
                \Laravel\Ai\agent()->prompt('ping', provider: $provider);
                return true;
            } catch (\Exception $e) {
                return false;
            }
        });

        return Inertia::render('Admin/Operational/Ai/Status', [
            'status' => [
                'provider' => strtoupper($provider),
                'is_healthy' => $isHealthy,
                'endpoint' => $config['url'] ?? '-',
                'model_text' => $config['models']['text']['default'] ?? 'qwen-plus',
                'last_check' => now()->toIso8601String(),
            ],
            'usage' => [
                'total_prompts' => Cache::get('ai_usage_total', 0),
                'successful_heals' => Cache::get('ai_heals_total', 0),
            ]
        ]);
    }
}
