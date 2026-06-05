<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\ProfileChangeRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ProfileChangeRequestController extends Controller
{
    use ApiResponse;

    private const PROFILE_STATUSES = ['pending', 'approved', 'rejected'];

    private const USER_FIELDS = [
        'name', 'email', 'phone', 'address', 'address_village_name',
        'address_district_name', 'address_regency_name', 'address_postal_code',
        'address_lat', 'address_lng', 'address_registered_at', 'address_verified_at',
    ];

    private const MAHASISWA_FIELDS = [
        'nik', 'mother_name', 'gender', 'shirt_size', 'birth_place', 'birth_date', 'nama',
    ];

    private const DOSEN_FIELDS = [
        'nama_gelar', 'nidn', 'dosen_nik', 'jabatan', 'kelas_jabatan', 'tugas_tambahan',
        'golongan', 'pangkat', 'no_rekening', 'nama_bank', 'npwp', 'gender', 'birth_date',
        'dosen_alamat', 'nama',
    ];

    /** GET /admin/profile-change-requests */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::in(self::PROFILE_STATUSES)],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $requests = ProfileChangeRequest::with(['user', 'reviewer'])
            ->when($validated['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->latest()
            ->paginate((int) ($validated['per_page'] ?? 20));

        return $this->success($requests);
    }

    /** PATCH /admin/profile-change-requests/{id}/approve */
    public function approve(Request $request, ProfileChangeRequest $profileChangeRequest): JsonResponse
    {
        if (! $profileChangeRequest->isPending()) {
            return $this->badRequest('Permintaan ini sudah diproses.');
        }

        DB::transaction(fn () => $this->applyApproval($request, $profileChangeRequest));

        return $this->success(null, 'Perubahan profil disetujui dan diterapkan.');
    }

    /** PATCH /admin/profile-change-requests/approve-all */
    public function approveAll(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['nullable', 'array', 'max:50'],
            'ids.*' => ['integer', 'distinct', 'exists:profile_change_requests,id'],
            'confirm' => ['required', 'accepted'],
        ]);

        $ids = $validated['ids'] ?? null;
        $query = ProfileChangeRequest::query()->where('status', 'pending')->oldest();
        if (is_array($ids) && count($ids) > 0) {
            $query->whereIn('id', $ids);
        }

        $requests = $query->limit(50)->get();
        $approved = 0;
        $failed = [];

        foreach ($requests as $profileChangeRequest) {
            try {
                DB::transaction(fn () => $this->applyApproval($request, $profileChangeRequest));
                $approved++;
            } catch (\Throwable $e) {
                report($e);
                $failed[] = $profileChangeRequest->id;
            }
        }

        return $this->success([
            'approved' => $approved,
            'failed' => $failed,
            'failed_count' => count($failed),
        ], count($failed) ? 'Sebagian permintaan berhasil disetujui.' : 'Semua permintaan pending berhasil disetujui.');
    }

    /** PATCH /admin/profile-change-requests/{id}/reject */
    public function reject(Request $request, ProfileChangeRequest $profileChangeRequest): JsonResponse
    {
        if (! $profileChangeRequest->isPending()) {
            return $this->badRequest('Permintaan ini sudah diproses.');
        }

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'min:10', 'max:500'],
        ]);

        $profileChangeRequest->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return $this->success(null, 'Permintaan perubahan profil ditolak.');
    }

    private function applyApproval(Request $request, ProfileChangeRequest $profileChangeRequest): void
    {
        $profileChangeRequest->refresh();
        if (! $profileChangeRequest->isPending()) {
            throw new \RuntimeException('Permintaan ini sudah diproses.');
        }

        $user = $profileChangeRequest->user;
        $changes = $profileChangeRequest->requested_changes ?? [];

        $userUpdate = [];
        $mahasiswaUpdate = [];
        $dosenUpdate = [];

        foreach ($changes as $field => $value) {
            $new = is_array($value) && array_key_exists('new', $value) ? $value['new'] : $value;
            if (in_array($field, self::USER_FIELDS, true)) {
                $userUpdate[$field] = $new;
            } elseif (in_array($field, self::MAHASISWA_FIELDS, true)) {
                $mahasiswaUpdate[$field] = $new;
            } elseif (in_array($field, self::DOSEN_FIELDS, true)) {
                $dosenUpdate[match ($field) {
                    'dosen_nik' => 'nik',
                    'dosen_alamat' => 'alamat',
                    default => $field,
                }] = $new;
            }
        }

        if ($userUpdate) {
            $user->fill($userUpdate)->save();
            $user->lockFields(array_keys($userUpdate));
        }
        if ($user->mahasiswa && $mahasiswaUpdate) {
            $user->mahasiswa->fill($mahasiswaUpdate)->save();
            $user->mahasiswa->lockFields(array_keys($mahasiswaUpdate));
        }
        if ($dosenUpdate && $user->dosen) {
            $user->dosen->fill($dosenUpdate)->save();
            $user->dosen->lockFields(array_keys($dosenUpdate));
        }

        $profileChangeRequest->update([
            'status' => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);
    }
}
