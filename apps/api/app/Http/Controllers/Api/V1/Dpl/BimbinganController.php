<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Dpl;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\BimbinganAttendance;
use App\Models\KKN\BimbinganSession;
use App\Models\KKN\KelompokKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * DPL side — Sistem Bimbingan Online (R6).
 *
 * Endpoints:
 *   GET   /dpl/bimbingan                                   — list sesi DPL ybs di periode aktif
 *   POST  /dpl/bimbingan                                   — buat sesi baru
 *   GET   /dpl/bimbingan/{session}                         — detail + kehadiran
 *   PATCH /dpl/bimbingan/{session}                         — update (topik/jadwal/etc)
 *   PATCH /dpl/bimbingan/{session}/complete                — tandai selesai + notulensi
 *   PATCH /dpl/bimbingan/{session}/cancel                  — cancel sesi
 *   POST  /dpl/bimbingan/{session}/attendance              — mark bulk attendance
 *   GET   /dpl/bimbingan/kelompok/{kelompok}/progress      — lihat progress min-4 sesi
 */
class BimbinganController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $dosen = $user?->dosen;
        abort_unless($dosen, 403);

        $sessions = BimbinganSession::where('dosen_id', $dosen->id)
            ->with(['kelompok.lokasi', 'attendances.mahasiswa.user'])
            ->when($request->integer('periode'), fn ($q, $p) => $q->where('periode_id', $p))
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('kelompok_id'), fn ($q, $k) => $q->where('kelompok_id', $k))
            ->orderByDesc('scheduled_at')
            ->paginate(20);

        return $this->success($sessions);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $dosen = $user?->dosen;
        abort_unless($dosen, 403);

        $data = $request->validate([
            'kelompok_id' => ['required', 'integer', 'exists:kelompok_kkn,id'],
            'periode_id' => ['required', 'integer', 'exists:periode,id'],
            'scheduled_at' => ['required', 'date'],
            'duration_minutes' => ['nullable', 'integer', 'min:15', 'max:480'],
            'topik' => ['required', 'string', 'max:255'],
            'agenda' => ['nullable', 'string', 'max:5000'],
            'meeting_link' => ['nullable', 'url', 'max:500'],
            'location' => ['nullable', 'string', 'max:255'],
            'mode' => ['nullable', Rule::in(['online', 'offline', 'hybrid'])],
        ]);

        // Pastikan DPL ybs memang memegang kelompok ini
        $kelompok = KelompokKkn::with('dosen')->findOrFail($data['kelompok_id']);
        $isDpl = $kelompok->dosen->contains(fn ($d) => $d->id === $dosen->id);
        abort_unless($isDpl, 403, 'Anda bukan DPL kelompok ini.');

        $session = BimbinganSession::create([
            ...$data,
            'duration_minutes' => $data['duration_minutes'] ?? 60,
            'mode' => $data['mode'] ?? 'online',
            'dosen_id' => $dosen->id,
            'status' => BimbinganSession::STATUS_SCHEDULED,
            'created_by' => $user->id,
        ]);

        return $this->created($session);
    }

    public function show(Request $request, BimbinganSession $session): JsonResponse
    {
        $this->authorizeDpl($request->user(), $session);

        $session->load(['kelompok.lokasi', 'attendances.mahasiswa.user']);

        return $this->success($session);
    }

    public function update(Request $request, BimbinganSession $session): JsonResponse
    {
        $this->authorizeDpl($request->user(), $session);

        abort_if($session->status === BimbinganSession::STATUS_COMPLETED, 422, 'Sesi sudah selesai dan tidak bisa diubah.');

        $data = $request->validate([
            'scheduled_at' => ['sometimes', 'date'],
            'duration_minutes' => ['sometimes', 'integer', 'min:15', 'max:480'],
            'topik' => ['sometimes', 'string', 'max:255'],
            'agenda' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'meeting_link' => ['sometimes', 'nullable', 'url', 'max:500'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'mode' => ['sometimes', Rule::in(['online', 'offline', 'hybrid'])],
        ]);

        $session->update($data);

        return $this->success($session);
    }

    public function complete(Request $request, BimbinganSession $session): JsonResponse
    {
        $this->authorizeDpl($request->user(), $session);

        abort_if($session->status === BimbinganSession::STATUS_COMPLETED, 422, 'Sesi sudah selesai.');
        abort_if($session->status === BimbinganSession::STATUS_CANCELLED, 422, 'Sesi sudah dibatalkan, tidak dapat diselesaikan.');

        $data = $request->validate([
            'notulensi' => ['required', 'string', 'min:20', 'max:10000'],
            'action_items' => ['nullable', 'string', 'max:5000'],
        ]);

        $session->update([
            ...$data,
            'status' => BimbinganSession::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);

        return $this->success($session);
    }

    public function cancel(Request $request, BimbinganSession $session): JsonResponse
    {
        $this->authorizeDpl($request->user(), $session);

        abort_if($session->status === BimbinganSession::STATUS_COMPLETED, 422, 'Sesi sudah selesai.');

        $session->update(['status' => BimbinganSession::STATUS_CANCELLED]);

        return $this->success($session);
    }

    public function markAttendance(Request $request, BimbinganSession $session): JsonResponse
    {
        $this->authorizeDpl($request->user(), $session);

        $data = $request->validate([
            'attendances' => ['required', 'array', 'min:1'],
            'attendances.*.mahasiswa_id' => ['required', 'integer', 'exists:mahasiswa,id'],
            'attendances.*.status' => ['required', Rule::in(['hadir', 'tidak_hadir', 'izin'])],
            'attendances.*.note' => ['nullable', 'string', 'max:500'],
        ]);

        foreach ($data['attendances'] as $a) {
            BimbinganAttendance::updateOrCreate(
                ['session_id' => $session->id, 'mahasiswa_id' => $a['mahasiswa_id']],
                [
                    'status' => $a['status'],
                    'note' => $a['note'] ?? null,
                    'marked_at' => now(),
                ]
            );
        }

        return $this->success($session->load('attendances.mahasiswa.user'));
    }

    public function progressForKelompok(Request $request, KelompokKkn $kelompok): JsonResponse
    {
        $dosen = $request->user()?->dosen;
        abort_unless($dosen, 403);
        $isDpl = $kelompok->dosen()->where('dosen.id', $dosen->id)->exists();
        abort_unless($isDpl, 403, 'Anda bukan DPL kelompok ini.');

        $completed = BimbinganSession::where('kelompok_id', $kelompok->id)
            ->where('status', BimbinganSession::STATUS_COMPLETED)
            ->count();

        $total = BimbinganSession::where('kelompok_id', $kelompok->id)->count();

        return $this->success([
            'kelompok_id' => $kelompok->id,
            'kelompok_code' => $kelompok->code,
            'total_sessions' => $total,
            'completed_sessions' => $completed,
            'required_min' => BimbinganSession::MIN_SESSIONS_REQUIRED,
            'percentage' => BimbinganSession::MIN_SESSIONS_REQUIRED > 0
                ? min(100, round($completed / BimbinganSession::MIN_SESSIONS_REQUIRED * 100))
                : 0,
            'meets_requirement' => $completed >= BimbinganSession::MIN_SESSIONS_REQUIRED,
        ]);
    }

    private function authorizeDpl($user, BimbinganSession $session): void
    {
        $dosen = $user?->dosen;
        abort_unless($dosen && $session->dosen_id === $dosen->id, 403, 'Akses ditolak.');
    }
}
