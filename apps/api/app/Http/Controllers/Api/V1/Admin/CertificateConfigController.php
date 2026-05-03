<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\LogAuditResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KonfigurasiSertifikat;
use App\Models\KKN\LogAudit;
use App\Models\KKN\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CertificateConfigController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        return $this->success(['config' => KonfigurasiSertifikat::when($request->input('periode_id'), fn ($q, $id) => $q->where('periode_id', $id))->first()]);
    }

    public function update(Request $request): JsonResponse
    {
        return $this->success(['config' => KonfigurasiSertifikat::updateOrCreate(['periode_id' => $request->input('periode_id')], $request->validate(['template_path' => ['nullable', 'string'], 'header_text' => ['nullable', 'string'], 'footer_text' => ['nullable', 'string']]))], 'Konfigurasi sertifikat berhasil diperbarui.');
    }
}
