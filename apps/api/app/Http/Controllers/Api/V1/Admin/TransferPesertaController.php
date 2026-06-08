<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\RegistrationHistory;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransferPesertaController extends Controller
{
    use ApiResponse;

    private function facultyScopeId(): ?int
    {
        $user = auth()->user();

        return $user?->hasRole('faculty_admin') && $user->fakultas_id
            ? (int) $user->fakultas_id
            : null;
    }

    private function scopeByFaculty($query): void
    {
        if ($facultyId = $this->facultyScopeId()) {
            $query->whereHas('mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
        }
    }

    private function ensurePesertaInFacultyScope(PesertaKkn $peserta): void
    {
        if ($facultyId = $this->facultyScopeId()) {
            $peserta->loadMissing('mahasiswa');
            abort_unless($peserta->mahasiswa?->fakultas_id === $facultyId, 403, 'Anda tidak memiliki akses ke peserta ini.');
        }
    }

    /**
     * List peserta yang bisa di-transfer (interview_failed, atau approved yang belum punya kelompok).
     */
    public function index(Request $request): JsonResponse
    {
        $query = PesertaKkn::with(['mahasiswa.prodi', 'mahasiswa.fakultas', 'periode.jenisKkn'])
            ->whereIn('status', ['interview_failed', 'approved'])
            ->whereNull('kelompok_id')
            ->when($request->input('angkatan'), fn ($q, $a) => $q->whereHas('periode', fn ($p) => $p->where('periode', $a)))
            ->when($request->input('search'), function ($q, $search) {
                $term = trim((string) $search);
                $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $term);
                $q->whereHas('mahasiswa', function ($m) use ($term, $escaped) {
                    $m->where('nama', 'ilike', "%{$escaped}%");
                    if (preg_match('/^\d{6,20}$/', $term)) {
                        $m->orWhere('nim_bidx', Mahasiswa::computeBlindIndex($term));
                    }
                });
            })
            ->orderBy('id');

        $this->scopeByFaculty($query);

        return $this->success(['data' => $query->get()]);
    }

    /**
     * Available periodes for transfer (non-interview jenis KKN in same angkatan).
     */
    public function periodes(Request $request): JsonResponse
    {
        $angkatan = $request->input('angkatan', 58);

        $periodes = Periode::with('jenisKkn')
            ->where('periode', $angkatan)
            ->whereHas('jenisKkn', fn ($q) => $q->where('requires_interview', false))
            ->get();

        return $this->success(['data' => $periodes]);
    }

    /**
     * Transfer peserta to another jenis KKN (different periode_id).
     */
    public function transfer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'peserta_kkn_id' => 'required|integer|exists:peserta_kkn,id',
            'target_periode_id' => 'required|integer|exists:periode,id',
        ]);

        $peserta = PesertaKkn::with(['mahasiswa', 'periode.jenisKkn'])->withCount(['attendances', 'locationDispensations'])->findOrFail($validated['peserta_kkn_id']);
        $targetPeriode = Periode::with('jenisKkn')->findOrFail($validated['target_periode_id']);

        $this->ensurePesertaInFacultyScope($peserta);

        if (!in_array($peserta->status, ['interview_failed', 'approved'], true)) {
            return $this->error('Hanya peserta dengan status gagal wawancara atau disetujui yang dapat ditransfer.', 422);
        }

        if ($peserta->kelompok_id !== null) {
            return $this->error('Peserta yang sudah tergabung dalam kelompok tidak dapat ditransfer langsung.', 422);
        }

        if ($peserta->periode_id === $targetPeriode->id) {
            return $this->error('Periode tujuan sama dengan periode asal.', 422);
        }

        if ($peserta->attendances_count > 0 || $peserta->location_dispensations_count > 0) {
            return $this->error('Peserta sudah memiliki data operasional lapangan; transfer manual diblokir agar relasi data tetap aman.', 422);
        }

        $alreadyRegistered = PesertaKkn::where('mahasiswa_id', $peserta->mahasiswa_id)
            ->where('periode_id', $targetPeriode->id)
            ->where('id', '!=', $peserta->id)
            ->exists();

        if ($alreadyRegistered) {
            return $this->error('Mahasiswa sudah terdaftar pada periode tujuan.', 422);
        }

        // Validate target periode doesn't require interview
        if ($targetPeriode->jenisKkn?->requires_interview) {
            return $this->error('Tidak dapat memindahkan ke jenis KKN yang memerlukan wawancara.', 422);
        }

        // Validate same angkatan
        if ($peserta->periode?->periode !== $targetPeriode->periode) {
            return $this->error('Periode tujuan harus dalam angkatan yang sama.', 422);
        }

        DB::transaction(function () use ($peserta, $targetPeriode) {
            $oldPeriode = $peserta->periode;

            RegistrationHistory::create([
                'peserta_kkn_id' => $peserta->id,
                'from_periode_id' => $oldPeriode?->id,
                'to_periode_id' => $targetPeriode->id,
                'from_kelompok_id' => $peserta->kelompok_id,
                'to_kelompok_id' => null,
                'reason' => 'Transfer dari halaman admin transfer peserta',
                'processed_by' => auth()->id(),
                'processed_at' => now(),
            ]);

            $peserta->update([
                'periode_id' => $targetPeriode->id,
                'status' => 'approved',
                'kelompok_id' => null,
                'role' => 'member',
                'joined_group_at' => null,
            ]);

            AuditService::log(
                'PESERTA_TRANSFER',
                "Peserta dipindahkan dari {$oldPeriode?->jenisKkn?->name} ke {$targetPeriode->jenisKkn?->name}",
                $peserta
            );
        });

        return $this->success($peserta->fresh()->load(['mahasiswa', 'periode.jenisKkn']), 'Peserta berhasil dipindahkan.');
    }
}
