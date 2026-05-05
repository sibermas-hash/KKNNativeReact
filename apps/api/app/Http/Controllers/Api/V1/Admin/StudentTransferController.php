<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentTransferController extends Controller
{
    use ApiResponse;

    public function transfer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'peserta_kkn_id' => ['required', 'exists:peserta_kkn,id'],
            'target_kelompok_id' => ['required', 'exists:kelompok_kkn,id'],
        ]);

        $peserta = PesertaKkn::findOrFail($validated['peserta_kkn_id']);
        $peserta->update([
            'kelompok_id' => $validated['target_kelompok_id'],
            'joined_group_at' => now(),
        ]);

        return $this->noContent('Mahasiswa berhasil dipindahkan.');
    }
}
