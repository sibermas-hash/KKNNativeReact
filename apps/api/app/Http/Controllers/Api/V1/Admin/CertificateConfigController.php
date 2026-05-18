<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KonfigurasiSertifikat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CertificateConfigController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $periodeId = $request->input('periode_id');
        $configs = KonfigurasiSertifikat::when($periodeId, fn ($q, $id) => $q->where('periode_id', $id))
            ->orderBy('id')
            ->get();

        return $this->success(['configs' => $configs]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'configs' => ['required', 'array'],
            'configs.*.config_key' => ['required', 'string'],
            'configs.*.label' => ['required', 'string'],
            'configs.*.value' => ['nullable', 'string'],
            'configs.*.type' => ['nullable', 'string'],
            'configs.*.periode_id' => ['nullable', 'integer'],
        ]);

        $results = [];
        foreach ($validated['configs'] as $item) {
            $results[] = KonfigurasiSertifikat::updateOrCreate(
                [
                    'config_key' => $item['config_key'],
                    'periode_id' => $item['periode_id'] ?? null,
                ],
                [
                    'label' => $item['label'],
                    'value' => $item['value'] ?? '',
                    'type' => $item['type'] ?? 'text',
                ]
            );
        }

        return $this->success(['configs' => $results], 'Konfigurasi sertifikat berhasil diperbarui.');
    }
}