<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicContentController extends Controller
{
    use ApiResponse;

    public function profile(): JsonResponse
    {
        return $this->success([
            'about' => SystemSetting::get('site_about', ''),
            'visi'  => SystemSetting::get('site_visi', ''),
            'misi'  => SystemSetting::get('site_misi', ''),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'about' => ['required', 'string', 'max:4000'],
            'visi'  => ['required', 'string', 'max:2000'],
            'misi'  => ['required', 'string', 'max:2000'],
        ]);

        SystemSetting::set('site_about', $validated['about']);
        SystemSetting::set('site_visi', $validated['visi']);
        SystemSetting::set('site_misi', $validated['misi']);

        return $this->success(null, 'Konten halaman profil berhasil diperbarui.');
    }

    public function schemes(): JsonResponse
    {
        return $this->success([
            'title'   => SystemSetting::get('site_schemes_title', ''),
            'intro'   => SystemSetting::get('site_schemes_intro', ''),
            'schemes' => json_decode((string) SystemSetting::get('site_schemes_items', '[]'), true) ?? [],
        ]);
    }

    public function updateSchemes(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'               => ['required', 'string', 'max:255'],
            'intro'               => ['required', 'string', 'max:2000'],
            'schemes'             => ['required', 'array', 'min:1', 'max:8'],
            'schemes.*.title'     => ['required', 'string', 'max:100'],
            'schemes.*.description' => ['required', 'string', 'max:500'],
            'schemes.*.color'     => ['required', 'in:emerald,blue,amber,slate'],
        ]);

        $items = collect($validated['schemes'])->map(fn ($s) => [
            'title'       => trim($s['title']),
            'description' => trim($s['description']),
            'color'       => $s['color'],
        ])->values()->all();

        SystemSetting::set('site_schemes_title', $validated['title']);
        SystemSetting::set('site_schemes_intro', $validated['intro']);
        SystemSetting::set('site_schemes_items', json_encode($items, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        return $this->success(null, 'Skema KKN berhasil diperbarui.');
    }
}
