<?php

declare(strict_types=1);

namespace App\Http\Controllers\Dosen;

use App\Http\Controllers\Controller;
use App\Models\KKN\DplPeriod;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaWorkshop;
use Illuminate\Http\Request;

class DplRegistrationController extends Controller
{
    /**
     * Dosen mendaftar sebagai DPL untuk periode tertentu.
     */
    public function store(Request $request)
    {
        $user = auth()->user();
        $dosen = $user->dosen;

        if (! $dosen) {
            return back()->with('error', 'Data dosen Anda tidak ditemukan dalam sistem.');
        }

        // Validasi: harus sudah lulus workshop
        $hasPassedWorkshop = PesertaWorkshop::where('user_id', $user->id)
            ->where('is_passed', true)
            ->exists();

        if (! $hasPassedWorkshop) {
            return back()->with('error', 'Anda harus lulus Workshop Pembekalan DPL terlebih dahulu.');
        }

        $validated = $request->validate([
            'periode_id' => 'required|exists:periode,id',
        ]);

        // Cek duplikat pendaftaran aktif pada periode yang sama
        $existing = DplPeriod::where('dosen_id', $dosen->id)
            ->where('periode_id', $validated['periode_id'])
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if ($existing) {
            $statusLabel = $existing->status === 'pending' ? 'menunggu verifikasi' : 'sudah disetujui';

            return back()->with('info', "Anda sudah memiliki pendaftaran DPL yang {$statusLabel} untuk periode ini.");
        }

        $periode = Periode::findOrFail($validated['periode_id']);

        DplPeriod::create([
            'dosen_id' => $dosen->id,
            'periode_id' => $periode->id,
            'max_kelompok_kkn' => 5,
            'is_active' => false,
            'status' => 'pending',
        ]);

        return back()->with('success', 'Pendaftaran DPL berhasil diajukan. Silakan menunggu verifikasi dari admin.');
    }
}
