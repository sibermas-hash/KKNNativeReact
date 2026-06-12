<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\KelompokKkn;
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

        $paginated = $query->paginate($request->integer('per_page', 25));

        return $this->success([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'last_page' => $paginated->lastPage(),
            ],
        ]);
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

        if (! in_array($peserta->status, ['interview_failed', 'approved'], true)) {
            return $this->error('VALIDATION_ERROR', 'Hanya peserta dengan status gagal wawancara atau disetujui yang dapat ditransfer.', 422);
        }

        if ($peserta->kelompok_id !== null) {
            return $this->error('VALIDATION_ERROR', 'Peserta yang sudah tergabung dalam kelompok tidak dapat ditransfer langsung.', 422);
        }

        if ($peserta->periode_id === $targetPeriode->id) {
            return $this->error('VALIDATION_ERROR', 'Periode tujuan sama dengan periode asal.', 422);
        }

        if ($peserta->attendances_count > 0 || $peserta->location_dispensations_count > 0) {
            return $this->error('VALIDATION_ERROR', 'Peserta sudah memiliki data operasional lapangan; transfer manual diblokir agar relasi data tetap aman.', 422);
        }

        $alreadyRegistered = PesertaKkn::where('mahasiswa_id', $peserta->mahasiswa_id)
            ->where('periode_id', $targetPeriode->id)
            ->where('id', '!=', $peserta->id)
            ->exists();

        if ($alreadyRegistered) {
            return $this->error('VALIDATION_ERROR', 'Mahasiswa sudah terdaftar pada periode tujuan.', 422);
        }

        // Validate target periode doesn't require interview
        if ($targetPeriode->jenisKkn?->requires_interview) {
            return $this->error('VALIDATION_ERROR', 'Tidak dapat memindahkan ke jenis KKN yang memerlukan wawancara.', 422);
        }

        // Validate same angkatan
        if ($peserta->periode?->periode !== $targetPeriode->periode) {
            return $this->error('VALIDATION_ERROR', 'Periode tujuan harus dalam angkatan yang sama.', 422);
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

    /**
     * Peserta final yang aman dipindahkan antar kelompok dalam periode sama.
     */
    public function placementCandidates(Request $request): JsonResponse
    {
        $query = PesertaKkn::with(['mahasiswa.prodi', 'mahasiswa.fakultas', 'periode.jenisKkn', 'kelompok.lokasi'])
            ->whereIn('status', ['approved', 'interview_passed'])
            ->when($request->input('angkatan'), fn ($q, $a) => $q->whereHas('periode', fn ($p) => $p->where('periode', $a)))
            ->when($request->input('periode_id'), fn ($q, $id) => $q->where('periode_id', $id))
            ->when($request->input('kelompok_id'), fn ($q, $id) => $q->where('kelompok_id', $id))
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

        $paginated = $query->paginate($request->integer('per_page', 25));

        return $this->success([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'last_page' => $paginated->lastPage(),
            ],
        ]);
    }

    /**
     * Kelompok tujuan dalam periode yang sama; dipakai dropdown mutasi lokasi/kelompok.
     */
    public function placementGroups(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'periode_id' => 'required|integer|exists:periode,id',
            'search' => 'nullable|string|max:100',
        ]);

        $search = trim((string) ($validated['search'] ?? ''));

        $groups = KelompokKkn::with('lokasi')
            ->withCount('peserta')
            ->where('periode_id', $validated['periode_id'])
            ->when($search !== '', function ($q) use ($search) {
                $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $search);
                $q->where(function ($qq) use ($escaped) {
                    $qq->where('nama_kelompok', 'ilike', "%{$escaped}%")
                        ->orWhere('code', 'ilike', "%{$escaped}%")
                        ->orWhereHas('lokasi', fn ($l) => $l
                            ->where('village_name', 'ilike', "%{$escaped}%")
                            ->orWhere('district_name', 'ilike', "%{$escaped}%")
                            ->orWhere('regency_name', 'ilike', "%{$escaped}%"));
                });
            })
            ->orderBy('nama_kelompok')
            ->limit(100)
            ->get();

        return $this->success(['data' => $groups]);
    }

    /**
     * Mutasi peserta antar kelompok/lokasi dalam periode yang sama.
     * Guardrails: admin pusat saja, periode sama, kapasitas dicek, audit tercatat.
     */
    public function movePlacement(Request $request): JsonResponse
    {
        if (auth()->user()?->hasRole('faculty_admin')) {
            return $this->forbidden('Admin fakultas hanya memiliki akses baca untuk mutasi lokasi/kelompok.');
        }

        $validated = $request->validate([
            'peserta_kkn_id' => 'required|integer|exists:peserta_kkn,id',
            'target_kelompok_id' => 'required|integer|exists:kelompok_kkn,id',
            'reason' => 'required|string|min:5|max:500',
        ]);

        $peserta = PesertaKkn::with(['mahasiswa', 'periode.jenisKkn', 'kelompok'])
            ->withCount(['attendances', 'locationDispensations'])
            ->findOrFail($validated['peserta_kkn_id']);
        $target = KelompokKkn::with('lokasi')->withCount('peserta')->findOrFail($validated['target_kelompok_id']);

        if (! in_array($peserta->status, ['approved', 'interview_passed'], true)) {
            return $this->error('VALIDATION_ERROR', 'Hanya peserta final/disetujui yang dapat dimutasi lokasi/kelompok.', 422);
        }

        if ((int) $peserta->periode_id !== (int) $target->periode_id) {
            return $this->error('VALIDATION_ERROR', 'Kelompok tujuan harus berada pada periode/jenis KKN yang sama.', 422);
        }

        if ($peserta->kelompok_id !== null && (int) $peserta->kelompok_id === (int) $target->id) {
            return $this->error('VALIDATION_ERROR', 'Kelompok tujuan sama dengan kelompok asal.', 422);
        }

        if ($peserta->attendances_count > 0 || $peserta->location_dispensations_count > 0) {
            return $this->error('VALIDATION_ERROR', 'Peserta sudah memiliki data operasional lapangan; mutasi lokasi/kelompok diblokir agar relasi data tetap aman.', 422);
        }

        if ($target->capacity !== null && $target->peserta_count >= $target->capacity) {
            return $this->error('VALIDATION_ERROR', 'Kapasitas kelompok tujuan sudah penuh.', 422);
        }

        DB::transaction(function () use ($peserta, $target, $validated) {
            $oldKelompokId = $peserta->kelompok_id;
            $oldKelompokName = $peserta->kelompok?->nama_kelompok ?? '-';

            RegistrationHistory::create([
                'peserta_kkn_id' => $peserta->id,
                'from_periode_id' => $peserta->periode_id,
                'to_periode_id' => $peserta->periode_id,
                'from_kelompok_id' => $oldKelompokId,
                'to_kelompok_id' => $target->id,
                'reason' => $validated['reason'],
                'processed_by' => auth()->id(),
                'processed_at' => now(),
            ]);

            $peserta->update([
                'kelompok_id' => $target->id,
                'role' => $peserta->role === 'ketua' ? 'member' : ($peserta->role ?? 'member'),
                'joined_group_at' => now(),
            ]);

            AuditService::log(
                'PESERTA_PLACEMENT_MOVE',
                "Peserta dipindahkan dari kelompok {$oldKelompokName} ke {$target->nama_kelompok}",
                $peserta
            );
        });

        return $this->success($peserta->fresh()->load(['mahasiswa', 'periode.jenisKkn', 'kelompok.lokasi']), 'Peserta berhasil dimutasi lokasi/kelompok.');
    }
}
