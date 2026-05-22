<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Services\KKN\AutoPlottingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AutoPlottingController extends Controller
{
    use ApiResponse;

    public function simulate(Request $request, AutoPlottingService $service): JsonResponse
    {
        $data = $request->validate([
            'periode_id'=>['required','exists:periode,id'],
            'group_size'=>['nullable','integer','min:10','max:20'],
        ]);
        $result = $service->simulate((int)$data['periode_id'], (int)($data['group_size'] ?? 15));
        $result['mode'] = 'simulasi';
        $result['safe_note'] = 'Mode simulasi: tidak menulis/mengubah data real.';
        return $this->success($result);
    }

    public function apply(Request $request, AutoPlottingService $service): JsonResponse
    {
        if (auth()->user()?->hasRole('faculty_admin')) return $this->error('FORBIDDEN','Admin fakultas tidak boleh menerapkan plotting.',403);
        $data = $request->validate([
            'periode_id'=>['required','exists:periode,id'],
            'group_size'=>['nullable','integer','min:10','max:20'],
            'confirm'=>['accepted'],
            'mode'=>['required','in:real'],
        ]);
        $result = $service->apply((int)$data['periode_id'], (int)($data['group_size'] ?? 15));
        $result['mode'] = 'real';
        $result['safe_note'] = 'Mode real: menulis kelompok dan update peserta_kkn.kelompok_id.';
        return $this->success($result);
    }
}
