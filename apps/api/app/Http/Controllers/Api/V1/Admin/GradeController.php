<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\NilaiKknResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\NilaiKkn;
use App\Services\GradingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    use ApiResponse;

    /**
     * Audit R11-FAC-002 fix: faculty_admin hanya boleh lihat nilai mahasiswa
     * di fakultasnya. Write (store) dilarang total — hanya superadmin+admin
     * yang boleh menyimpan nilai. Konsisten dengan PesertaKknController dan
     * KelompokKknAdminController.
     */
    private function facultyScopeId(): ?int
    {
        $user = auth()->user();
        if ($user?->hasRole('faculty_admin') && $user->fakultas_id) {
            return (int) $user->fakultas_id;
        }

        return null;
    }

    public function index(Request $request): JsonResponse
    {
        $query = NilaiKkn::with(['user', 'kelompok.periode'])
            // Menu /admin/nilai untuk penilaian aktif KKN 58+.
            // Data historis 51-57 ditampilkan di /admin/legacy-kkn agar tidak mencampuri grading aktif.
            ->when(! $request->boolean('include_legacy'), fn ($q) => $q->whereNull('legacy_periode_kkn'))
            ->whereHas('kelompok.periode', fn ($q) => $q->where('is_active', true))
            ->when($request->input('kelompok_id'), fn ($q, $id) => $q->where('kelompok_id', $id))
            ->orderByDesc('created_at');

        // Faculty scoping: filter by mahasiswa fakultas via user relation.
        // NilaiKkn.user_id → User → Mahasiswa.fakultas_id.
        $facultyId = $this->facultyScopeId();
        if ($facultyId !== null) {
            $query->whereHas('user.mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
        }

        return $this->successCollection(NilaiKknResource::collection($query->paginate(25)));
    }

    public function store(Request $request): JsonResponse
    {
        // faculty_admin tidak boleh ubah nilai (read-only role).
        if (auth()->user()?->hasRole('faculty_admin')) {
            return $this->error('FORBIDDEN', 'Admin fakultas hanya memiliki akses baca (read-only).', 403);
        }

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'kelompok_id' => ['required', 'exists:kelompok_kkn,id'],
            'scores' => ['required', 'array'],
        ]);

        // Active-only guard: tolak nilai untuk kelompok di periode non-aktif.
        $kelompok = \App\Models\KKN\KelompokKkn::with('periode')->find($validated['kelompok_id']);
        if (! $kelompok?->periode?->is_active) {
            return $this->error('INVALID_PERIOD', 'Nilai hanya bisa diinput untuk kelompok pada periode aktif.', 422);
        }

        $score = NilaiKkn::updateOrCreate(
            ['user_id' => $validated['user_id'], 'kelompok_id' => $validated['kelompok_id']],
            array_merge($validated['scores'], [
                'admin_graded_by' => auth()->id(),
                'admin_graded_at' => now(),
            ]),
        );

        // G-04 fix: recalc after save
        app(GradingService::class)->calculateFinalGrade($score);

        return $this->success(
            new NilaiKknResource($score->fresh()),
            'Nilai berhasil disimpan.'
        );
    }
}
