<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Dosen;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaWorkshop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DplRegistrationController extends Controller
{
    use ApiResponse;

    /**
     * Dosen mendaftar sebagai DPL untuk periode tertentu.
     * Syarat: sudah lulus workshop pembekalan.
     */
    public function store(Request $request): JsonResponse
    {
        $user  = auth()->user();
        $dosen = $user->dosen;

        if (! $dosen) {
            return $this->error('Data dosen Anda tidak ditemukan dalam sistem.', 422);
        }

        $hasPassedWorkshop = PesertaWorkshop::where('user_id', $user->id)
            ->where('is_passed', true)
            ->exists();

        if (! $hasPassedWorkshop) {
            return $this->error('Anda harus lulus Workshop Pembekalan DPL terlebih dahulu.', 422);
        }

        $validated = $request->validate([
            'periode_id' => 'required|exists:periode,id',
        ]);

        $existing = DplPeriod::where('dosen_id', $dosen->id)
            ->where('periode_id', $validated['periode_id'])
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if ($existing) {
            $label = $existing->status === 'pending' ? 'menunggu verifikasi' : 'sudah disetujui';

            return $this->error("Anda sudah memiliki pendaftaran DPL yang {$label} untuk periode ini.", 409);
        }

        $periode = Periode::findOrFail($validated['periode_id']);

        $registration = DplPeriod::create([
            'dosen_id'        => $dosen->id,
            'periode_id'      => $periode->id,
            'max_kelompok_kkn' => 5,
            'is_active'       => false,
            'status'          => 'pending',
        ]);

        return $this->success($registration, 'Pendaftaran DPL berhasil diajukan. Menunggu verifikasi admin.', 201);
    }
}
