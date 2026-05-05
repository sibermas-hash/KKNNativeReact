<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\SertifikatKknResource;
use App\Http\Resources\Api\V1\NilaiKknResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\SertifikatKkn;
use Illuminate\Http\JsonResponse;

class CertificateController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $user = auth()->user();

        $scores = NilaiKkn::where('user_id', $user->id)
            ->where('is_finalized', true)
            ->with(['kelompok'])
            ->get();

        $certificates = SertifikatKkn::where('user_id', $user->id)
            ->valid()
            ->with(['periode'])
            ->get();

        return $this->success([
            'scores' => NilaiKknResource::collection($scores),
            'certificates' => SertifikatKknResource::collection($certificates),
        ]);
    }

    public function download(SertifikatKkn $sertifikat): JsonResponse
    {
        if ($sertifikat->user_id !== auth()->id()) {
            return $this->forbidden();
        }

        if ($sertifikat->isRevoked()) {
            return $this->error('FORBIDDEN', 'Sertifikat telah dibatalkan.', 403);
        }

        return $this->success([
            'download_url' => url("/api/v1/student/certificates/{$sertifikat->id}/download"),
            'certificate_number' => $sertifikat->certificate_number,
        ]);
    }
}
