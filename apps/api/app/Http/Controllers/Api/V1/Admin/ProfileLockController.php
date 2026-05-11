<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Dosen;
use App\Models\KKN\Mahasiswa;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Admin surface for the "field lock" registry (App\Traits\HasManuallyEditedFields).
 *
 * The lock list records which fields on a mahasiswa / dosen / user have been
 * edited by hand (either by the user during onboarding or by admin approving
 * a profile-change request) and must therefore NOT be overwritten by a
 * subsequent SIAKAD sync.
 *
 * Superadmin may release a lock — but only for mahasiswa who have NEVER been
 * placed into a KKN group. Once a mahasiswa has KKN history, their record
 * is permanently frozen (business rule: KKN snapshot is immutable).
 *
 * Dosen records do not have the "sudah KKN" concept, so their locks are
 * always releasable.
 */
class ProfileLockController extends Controller
{
    use ApiResponse;

    /** GET /admin/mahasiswa/{mahasiswa}/locks */
    public function showMahasiswa(Mahasiswa $mahasiswa): JsonResponse
    {
        $mahasiswa->loadMissing('user');

        return $this->success([
            'mahasiswa_id' => $mahasiswa->id,
            'nim' => $mahasiswa->nim,
            'nama' => $mahasiswa->nama,
            'has_ever_been_in_kkn' => $mahasiswa->hasEverBeenInKkn(),
            'is_unlockable' => ! $mahasiswa->hasEverBeenInKkn(),
            'locked_fields' => $mahasiswa->lockedFields(),
            'user_locked_fields' => $mahasiswa->user?->lockedFields() ?? [],
        ]);
    }

    /**
     * PATCH /admin/mahasiswa/{mahasiswa}/unlock-field
     *
     * Body: { "field": "birth_date", "scope": "mahasiswa" | "user" }
     *
     * When scope=user, the lock is removed from the linked User row (useful
     * for user-level fields like address, phone, name). When scope=mahasiswa
     * (default), the lock is removed from the mahasiswa row.
     */
    public function unlockMahasiswaField(Request $request, Mahasiswa $mahasiswa): JsonResponse
    {
        $validated = $request->validate([
            'field' => ['required', 'string', 'max:100'],
            'scope' => ['nullable', 'in:mahasiswa,user'],
        ]);

        if ($mahasiswa->hasEverBeenInKkn()) {
            return $this->badRequest(
                'Mahasiswa ini sudah pernah mengikuti KKN — data dibekukan dan lock tidak dapat dibuka. '.
                'Data snapshot wajib dijaga sebagai bukti peserta.'
            );
        }

        $scope = $validated['scope'] ?? 'mahasiswa';
        $field = $validated['field'];

        DB::transaction(function () use ($mahasiswa, $scope, $field, $request) {
            if ($scope === 'user') {
                $mahasiswa->loadMissing('user');
                if (! $mahasiswa->user) {
                    abort(404, 'User terhubung tidak ditemukan.');
                }
                $mahasiswa->user->unlockField($field);
            } else {
                $mahasiswa->unlockField($field);
            }

            Log::info('Field lock released by admin', [
                'mahasiswa_id' => $mahasiswa->id,
                'nim' => $mahasiswa->nim,
                'scope' => $scope,
                'field' => $field,
                'admin_user_id' => $request->user()?->id,
            ]);
        });

        return $this->success([
            'mahasiswa_id' => $mahasiswa->id,
            'scope' => $scope,
            'unlocked_field' => $field,
            'remaining_mahasiswa_locks' => $mahasiswa->fresh()->lockedFields(),
            'remaining_user_locks' => $mahasiswa->fresh()->user?->lockedFields() ?? [],
        ], "Lock untuk field '{$field}' berhasil dibuka. Sinkronisasi SIAKAD berikutnya akan mengisi ulang field ini.");
    }

    /** GET /admin/dosen/{dosen}/locks */
    public function showDosen(Dosen $dosen): JsonResponse
    {
        $dosen->loadMissing('user');

        return $this->success([
            'dosen_id' => $dosen->id,
            'nip' => $dosen->nip,
            'nama' => $dosen->nama,
            'locked_fields' => $dosen->lockedFields(),
            'user_locked_fields' => $dosen->user?->lockedFields() ?? [],
        ]);
    }

    /** PATCH /admin/dosen/{dosen}/unlock-field */
    public function unlockDosenField(Request $request, Dosen $dosen): JsonResponse
    {
        $validated = $request->validate([
            'field' => ['required', 'string', 'max:100'],
            'scope' => ['nullable', 'in:dosen,user'],
        ]);

        $scope = $validated['scope'] ?? 'dosen';
        $field = $validated['field'];

        DB::transaction(function () use ($dosen, $scope, $field, $request) {
            if ($scope === 'user') {
                $dosen->loadMissing('user');
                if (! $dosen->user) {
                    abort(404, 'User terhubung tidak ditemukan.');
                }
                $dosen->user->unlockField($field);
            } else {
                $dosen->unlockField($field);
            }

            Log::info('Dosen field lock released by admin', [
                'dosen_id' => $dosen->id,
                'nip' => $dosen->nip,
                'scope' => $scope,
                'field' => $field,
                'admin_user_id' => $request->user()?->id,
            ]);
        });

        return $this->success([
            'dosen_id' => $dosen->id,
            'scope' => $scope,
            'unlocked_field' => $field,
            'remaining_dosen_locks' => $dosen->fresh()->lockedFields(),
            'remaining_user_locks' => $dosen->fresh()->user?->lockedFields() ?? [],
        ], "Lock untuk field '{$field}' berhasil dibuka.");
    }
}
