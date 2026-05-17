<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\ProfileChangeRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProfileChangeRequestController extends Controller
{
    use ApiResponse;

    /** GET /admin/profile-change-requests */
    public function index(Request $request): JsonResponse
    {
        $requests = ProfileChangeRequest::with(['user', 'reviewer'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->latest()
            ->paginate(20);

        return $this->success($requests);
    }

    /** PATCH /admin/profile-change-requests/{id}/approve */
    public function approve(Request $request, ProfileChangeRequest $profileChangeRequest): JsonResponse
    {
        if (! $profileChangeRequest->isPending()) {
            return $this->badRequest('Permintaan ini sudah diproses.');
        }

        DB::transaction(function () use ($request, $profileChangeRequest) {
            $user = $profileChangeRequest->user;
            $changes = $profileChangeRequest->requested_changes;

            $userFields = ['name', 'phone', 'address', 'address_village_name', 'address_district_name', 'address_regency_name', 'address_postal_code', 'address_lat', 'address_lng', 'address_registered_at', 'address_verified_at'];
            $mahasiswaFields = ['nik', 'mother_name', 'gender', 'shirt_size', 'birth_place', 'birth_date', 'nama'];
            $dosenFields = ['nama_gelar', 'nidn', 'dosen_nik', 'jabatan', 'kelas_jabatan', 'tugas_tambahan', 'golongan', 'pangkat', 'no_rekening', 'nama_bank', 'npwp', 'gender', 'birth_date', 'dosen_alamat', 'nama'];

            $userUpdate = [];
            $mahasiswaUpdate = [];
            $dosenUpdate = [];

            foreach ($changes as $field => $value) {
                $new = is_array($value) && array_key_exists('new', $value) ? $value['new'] : $value;
                if (in_array($field, $userFields)) {
                    $userUpdate[$field] = $new;
                } elseif (in_array($field, $mahasiswaFields)) {
                    $mahasiswaUpdate[$field] = $new;
                } elseif (in_array($field, $dosenFields)) {
                    $dosenUpdate[match ($field) {
                        'dosen_nik' => 'nik',
                        'dosen_alamat' => 'alamat',
                        default => $field,
                    }] = $new;
                }
            }

            if ($userUpdate) {
                $user->fill($userUpdate)->save();
                // Field-lock registry: fields approved here are now authoritative
                // in SIBERMAS and must not be overwritten by future SIAKAD syncs.
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
        });

        return $this->success(null, 'Perubahan profil disetujui dan diterapkan.');
    }


    /** PATCH /admin/profile-change-requests/approve-all */
    public function approveAll(Request $request): JsonResponse
    {
        $ids = $request->input('ids');

        $query = ProfileChangeRequest::query()->where('status', 'pending')->oldest();
        if (is_array($ids) && count($ids) > 0) {
            $query->whereIn('id', array_map('intval', $ids));
        }

        $requests = $query->limit(500)->get();
        $approved = 0;
        $failed = [];

        foreach ($requests as $profileChangeRequest) {
            try {
                DB::transaction(function () use ($request, $profileChangeRequest) {
                    $user = $profileChangeRequest->user;
                    $changes = $profileChangeRequest->requested_changes;

                    $userFields = ['name', 'phone', 'address', 'address_village_name', 'address_district_name', 'address_regency_name', 'address_postal_code', 'address_lat', 'address_lng', 'address_registered_at', 'address_verified_at'];
                    $mahasiswaFields = ['nik', 'mother_name', 'gender', 'shirt_size', 'birth_place', 'birth_date', 'nama'];
                    $dosenFields = ['nama_gelar', 'nidn', 'dosen_nik', 'jabatan', 'kelas_jabatan', 'tugas_tambahan', 'golongan', 'pangkat', 'no_rekening', 'nama_bank', 'npwp', 'gender', 'birth_date', 'dosen_alamat', 'nama'];

                    $userUpdate = [];
                    $mahasiswaUpdate = [];
                    $dosenUpdate = [];

                    foreach ($changes as $field => $value) {
                        $new = is_array($value) && array_key_exists('new', $value) ? $value['new'] : $value;
                        if (in_array($field, $userFields, true)) {
                            $userUpdate[$field] = $new;
                        } elseif (in_array($field, $mahasiswaFields, true)) {
                            $mahasiswaUpdate[$field] = $new;
                        } elseif (in_array($field, $dosenFields, true)) {
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
                });
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

        $request->validate([
            'rejection_reason' => ['required', 'string', 'min:10', 'max:500'],
        ]);

        $profileChangeRequest->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'rejection_reason' => $request->input('rejection_reason'),
        ]);

        return $this->success(null, 'Permintaan perubahan profil ditolak.');
    }
}
