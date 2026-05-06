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
        $user = auth()->user();

        // Student: can only download their own certificate
        if ($user->hasRole('student')) {
            if ($sertifikat->user_id !== $user->id) {
                return $this->forbidden();
            }
        // DPL: can only download certificates for students in their groups
        } elseif ($user->hasRole('dpl')) {
            $dosen = $user->dosen;
            if (! $dosen) {
                return $this->error('FORBIDDEN', 'Data dosen tidak ditemukan.', 403);
            }
            $groupIds = $dosen->kelompokKkn()->pluck('kelompok_kkn.id');
            $score = \App\Models\KKN\NilaiKkn::where('sertifikat_kkn_id', $sertifikat->id)->first();
            if (! $score || ! $groupIds->contains($score->kelompok_id)) {
                return $this->error('FORBIDDEN', 'Anda tidak memiliki akses ke sertifikat ini.', 403);
            }
        }

        if ($sertifikat->isRevoked()) {
            return $this->error('FORBIDDEN', 'Sertifikat telah dibatalkan.', 403);
        }

        return $this->success([
            'download_url' => \Illuminate\Support\Facades\Storage::disk(config('filesystems.default'))->url($sertifikat->file_path),
            'certificate_number' => $sertifikat->certificate_number,
        ]);
    }
}
