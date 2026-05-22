<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;

class AiHealthController extends Controller
{
    public function show(): JsonResponse
    {
        $user = auth()->user();
        if (! $user || ! $user->hasRole('superadmin')) {
            abort(403);
        }

        $url = rtrim((string) config('ai.router.url', ''), '/');
        $key = (string) config('ai.router.key', '');
        $models = array_values(array_filter(array_map('trim', explode(',', (string) config('ai.router.models', '')))));
        $primary = (string) config('ai.failover.primary.model', env('AI_PRIMARY_MODEL', ''));

        $issues = [];
        $available = [];
        $ok = false;
        $message = 'AI avatar aktif.';

        if ($url === '' || $key === '') {
            $issues[] = 'AI_ROUTER_URL atau AI_ROUTER_KEY kosong.';
        } else {
            try {
                $response = Http::timeout(12)
                    ->acceptJson()
                    ->withToken($key)
                    ->get($url.'/models');

                if (! $response->successful()) {
                    $issues[] = 'Router AI error HTTP '.$response->status().'. Token mungkin habis/tidak valid atau router bermasalah.';
                } else {
                    $available = collect($response->json('data', []))->pluck('id')->filter()->values()->all();
                    $configured = $models ?: array_values(array_filter([$primary]));
                    $missing = array_values(array_diff($configured, $available));
                    if ($configured && count($missing) === count($configured)) {
                        $issues[] = 'Model AI di .env tidak tersedia di router.';
                    } elseif ($missing) {
                        $issues[] = 'Sebagian model AI di .env tidak tersedia: '.implode(', ', $missing);
                    } else {
                        $ok = true;
                    }
                }
            } catch (\Throwable $e) {
                $issues[] = 'Router AI tidak bisa dihubungi: '.$e->getMessage();
            }
        }

        if (! $ok) {
            $message = 'AI validasi foto tidak bekerja normal. Upload foto masih memakai validasi lokal; segera cek token/router/model.';
        }

        return response()->json([
            'ok' => $ok,
            'message' => $message,
            'issues' => $issues,
            'router_url' => $url,
            'configured_models' => $models,
            'primary_model' => $primary,
            'available_models' => $available,
            'checked_at' => now()->toISOString(),
        ]);
    }
}
