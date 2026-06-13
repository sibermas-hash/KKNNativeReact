<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\Region\IndonesiaDistrict;
use App\Models\Region\IndonesiaProvince;
use App\Models\Region\IndonesiaRegency;
use App\Models\Region\IndonesiaVillage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IndonesiaRegionController extends Controller
{
    use ApiResponse;

    public function provinces(Request $request): JsonResponse
    {
        return $this->success(IndonesiaProvince::query()
            ->when($request->input('search'), fn ($q, $s) => $q->where('name', 'like', '%'.addcslashes((string) $s, '%_\\').'%'))
            ->orderBy('name')
            ->get(['code', 'name']));
    }

    public function regencies(Request $request): JsonResponse
    {
        $validated = $request->validate(['province_code' => ['required', 'string', 'size:2']]);

        return $this->success(IndonesiaRegency::query()
            ->where('province_code', $validated['province_code'])
            ->orderBy('name')
            ->get(['code', 'province_code', 'name']));
    }

    public function districts(Request $request): JsonResponse
    {
        $validated = $request->validate(['regency_code' => ['required', 'string', 'size:5']]);

        return $this->success(IndonesiaDistrict::query()
            ->where('regency_code', $validated['regency_code'])
            ->orderBy('name')
            ->get(['code', 'regency_code', 'name']));
    }

    public function villages(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'district_code' => ['required', 'string', 'size:8'],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        return $this->success(IndonesiaVillage::query()
            ->where('district_code', $validated['district_code'])
            ->when($validated['search'] ?? null, fn ($q, $s) => $q->where('name', 'like', '%'.addcslashes((string) $s, '%_\\').'%'))
            ->orderBy('name')
            ->limit(500)
            ->get(['code', 'district_code', 'name']));
    }
}
