<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\CountdownSetting;
use App\Models\KKN\Periode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CountdownSettingController extends Controller
{
    use ApiResponse;
    public function show(int $periodeId): JsonResponse
    {
        $setting = CountdownSetting::where('periode_id', $periodeId)->first();

        if (!$setting) {
            $periode = Periode::findOrFail($periodeId);
            // Return default based on periode dates
            return $this->success([
                'periode_id' => $periodeId,
                'enabled' => false,
                'title' => 'Pendaftaran Dibuka Dalam',
                'subtitle' => $periode->name,
                'countdown_start' => null,
                'countdown_end' => null,
                'display_location' => 'home',
                'style' => 'hero',
            ]);
        }

        return $this->success($setting);
    }

    public function store(Request $request, int $periodeId): JsonResponse
    {
        Periode::findOrFail($periodeId);

        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'countdown_start' => ['nullable', 'date'],
            'countdown_end' => ['nullable', 'date'],
            'display_location' => ['nullable', 'string', 'in:home,dashboard,both'],
            'style' => ['nullable', 'string', 'in:hero,banner,minimal'],
        ]);

        $setting = CountdownSetting::updateOrCreate(
            ['periode_id' => $periodeId],
            array_merge($validated, ['periode_id' => $periodeId])
        );

        return $this->success($setting, $setting->wasRecentlyCreated ? 'Countdown dibuat' : 'Countdown diperbarui');
    }

    public function active(): JsonResponse
    {
        $settings = CountdownSetting::with('periode')
            ->where('enabled', true)
            ->whereNotNull('countdown_end')
            ->where('countdown_end', '>', now())
            ->get();

        return $this->success($settings);
    }
}
