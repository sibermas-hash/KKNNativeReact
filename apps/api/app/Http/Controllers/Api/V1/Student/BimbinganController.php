<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\BimbinganSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Student side — Sistem Bimbingan Online (R6).
 *
 * Endpoints:
 *   GET /student/bimbingan                          — list sesi kelompoknya (mendatang + lampau)
 *   GET /student/bimbingan/{session}                — detail sesi + notulensi (kalau completed)
 *   GET /student/bimbingan/progress                 — progress min-4 sesi untuk kelompoknya
 */
class BimbinganController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $mahasiswa = $user?->mahasiswa;
        abort_unless($mahasiswa, 403, 'Akun ini bukan mahasiswa.');

        $peserta = $mahasiswa->peserta()
            ->when($request->integer('periode'), fn ($q, $p) => $q->where('periode_id', $p))
            ->whereNotNull('kelompok_id')
            ->latest('periode_id')
            ->first();

        if (! $peserta) {
            return $this->success(['sessions' => [], 'message' => 'Belum ditempatkan di kelompok.']);
        }

        $sessions = BimbinganSession::where('kelompok_id', $peserta->kelompok_id)
            ->with(['dosen.user'])
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('scheduled_at')
            ->paginate(20);

        return $this->success($sessions);
    }

    public function show(Request $request, BimbinganSession $session): JsonResponse
    {
        $user = $request->user();
        $mahasiswa = $user?->mahasiswa;
        abort_unless($mahasiswa, 403);

        // Cek akses — mahasiswa harus di kelompok sesi
        $peserta = $mahasiswa->peserta()->where('kelompok_id', $session->kelompok_id)->first();
        abort_unless($peserta, 403, 'Anda tidak berada di kelompok sesi ini.');

        $session->load(['dosen.user', 'attendances' => fn ($q) => $q->where('mahasiswa_id', $mahasiswa->id)]);

        return $this->success($session);
    }

    public function progress(Request $request): JsonResponse
    {
        $user = $request->user();
        $mahasiswa = $user?->mahasiswa;
        abort_unless($mahasiswa, 403);

        $peserta = $mahasiswa->peserta()
            ->when($request->integer('periode'), fn ($q, $p) => $q->where('periode_id', $p))
            ->whereNotNull('kelompok_id')
            ->latest('periode_id')
            ->first();

        if (! $peserta) {
            return $this->success([
                'meets_requirement' => false,
                'completed_sessions' => 0,
                'required_min' => BimbinganSession::MIN_SESSIONS_REQUIRED,
                'message' => 'Belum ditempatkan di kelompok.',
            ]);
        }

        $completed = BimbinganSession::where('kelompok_id', $peserta->kelompok_id)
            ->where('status', BimbinganSession::STATUS_COMPLETED)
            ->count();
        $total = BimbinganSession::where('kelompok_id', $peserta->kelompok_id)->count();

        return $this->success([
            'kelompok_id' => $peserta->kelompok_id,
            'total_sessions' => $total,
            'completed_sessions' => $completed,
            'required_min' => BimbinganSession::MIN_SESSIONS_REQUIRED,
            'percentage' => min(100, round($completed / BimbinganSession::MIN_SESSIONS_REQUIRED * 100)),
            'meets_requirement' => $completed >= BimbinganSession::MIN_SESSIONS_REQUIRED,
        ]);
    }
}
