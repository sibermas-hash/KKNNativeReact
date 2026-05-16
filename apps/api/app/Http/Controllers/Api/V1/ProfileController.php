<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Jobs\ValidateAvatarUploadJob;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DosenResource;
use App\Http\Resources\Api\V1\MahasiswaResource;
use App\Http\Resources\Api\V1\UserResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Dosen;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\SystemSetting;
use App\Models\ProfileChangeRequest;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\AvatarValidationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    use ApiResponse;

    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load(['mahasiswa.fakultas', 'mahasiswa.prodi', 'dosen.fakultas', 'fakultas']);
        $mahasiswa = $user->mahasiswa;
        $dosen = $user->dosen;

        $pending = ProfileChangeRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->latest()
            ->first();

        $profileComplete = $this->isProfileComplete($user);

        $studentMissing = $mahasiswa ? collect([
            'avatar' => $user->avatar,
            'nik' => $mahasiswa->nik,
            'mother_name' => $mahasiswa->mother_name,
            'birth_place' => $mahasiswa->birth_place,
            'birth_date' => $mahasiswa->birth_date,
            'gender' => $mahasiswa->gender,
            'shirt_size' => $mahasiswa->shirt_size,
            'phone' => $user->phone,
            'address' => $user->address,
        ])->filter(fn ($value) => blank($value))->keys()->values()->all() : [];

        $lecturerMissing = $dosen ? collect([
            'avatar' => $user->avatar,
            'nip' => $dosen->nip,
            'nama' => $dosen->nama,
            'jabatan' => $dosen->jabatan,
            'golongan' => $dosen->golongan,
            'no_rekening' => $dosen->no_rekening,
            'nama_bank' => $dosen->nama_bank,
            'npwp' => $dosen->npwp,
            'gender' => $dosen->gender,
            'birth_date' => $dosen->birth_date,
            'phone' => $user->phone,
            'address' => $user->address,
            'address_village_name' => $user->address_village_name,
            'address_district_name' => $user->address_district_name,
            'address_regency_name' => $user->address_regency_name,
            'address_verified_at' => $user->address_verified_at,
        ])->filter(fn ($value) => blank($value))->keys()->values()->all() : [];

        $addressMissing = collect([
            'address' => $user->address,
            'address_village_name' => $user->address_village_name,
            'address_district_name' => $user->address_district_name,
            'address_regency_name' => $user->address_regency_name,
            'address_postal_code' => $user->address_postal_code,
            'address_lat' => $user->address_lat,
            'address_lng' => $user->address_lng,
            'address_verified_at' => $user->address_verified_at,
        ])->filter(fn ($value) => blank($value))->keys()->values()->all();

        return $this->success([
            'user' => new UserResource($user),
            'student' => $mahasiswa ? array_merge((new MahasiswaResource($mahasiswa))->resolve($request), [
                'biodata_complete' => $studentMissing === [],
                'missing_biodata_fields' => $studentMissing,
                'address_complete' => $addressMissing === [],
                'address_verified' => filled($user->address_verified_at),
                'address_verified_at' => $user->address_verified_at?->toIso8601String(),
                'missing_address_fields' => $addressMissing,
            ]) : null,
            'lecturer' => $dosen ? array_merge((new DosenResource($dosen))->resolve($request), [
                'biodata_complete' => $lecturerMissing === [],
                'missing_biodata_fields' => $lecturerMissing,
            ]) : null,
            'profile_complete' => $profileComplete,
            'is_onboarding' => $user->must_change_password || ! $profileComplete,
            'pending_change_request' => $pending ? [
                'id' => $pending->id,
                'requested_changes' => $pending->requested_changes,
                'created_at' => $pending->created_at,
            ] : null,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load(['mahasiswa', 'dosen']);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],
            'address_village_name' => ['nullable', 'string', 'max:150'],
            'address_district_name' => ['nullable', 'string', 'max:150'],
            'address_regency_name' => ['nullable', 'string', 'max:150'],
            'address_postal_code' => ['nullable', 'string', 'max:10'],
            'address_lat' => ['nullable', 'numeric', 'between:-90,90'],
            'address_lng' => ['nullable', 'numeric', 'between:-180,180'],
            'address_verified' => ['nullable', 'boolean'],
            'address_verified_at' => ['nullable'],
            // Mahasiswa biodata
            'nik' => ['nullable', 'regex:/^\d{16}$/'],
            'mother_name' => ['nullable', 'string', 'max:150'],
            'gender' => ['nullable', 'in:L,P'],
            'shirt_size' => ['nullable', 'string', 'in:S,M,L,XL,XXL,3XL,4XL,5XL'],
            'birth_place' => ['nullable', 'string', 'max:100'],
            'birth_date' => ['nullable', 'date'],
            // Dosen fields
            'nama_gelar' => ['nullable', 'string', 'max:255'],
            'nidn' => ['nullable', 'string', 'max:50'],
            'dosen_nik' => ['nullable', 'string', 'max:50'],
            'jabatan' => ['nullable', 'string', 'max:100'],
            'kelas_jabatan' => ['nullable', 'string', 'max:50'],
            'tugas_tambahan' => ['nullable', 'string', 'max:150'],
            'golongan' => ['nullable', 'string', 'max:50'],
            'pangkat' => ['nullable', 'string', 'max:100'],
            'no_rekening' => ['nullable', 'string', 'max:50'],
            'nama_bank' => ['nullable', 'string', 'max:100'],
            'npwp' => ['nullable', 'string', 'max:50'],
            'dosen_alamat' => ['nullable', 'string', 'max:500'],
        ]);

        // Build diff: only include fields that actually changed
        $mahasiswa = $user->mahasiswa;
        $dosen = $user->dosen;

        $changes = [];

        $userMap = [
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'address' => $user->address,
            'address_village_name' => $user->address_village_name,
            'address_district_name' => $user->address_district_name,
            'address_regency_name' => $user->address_regency_name,
            'address_postal_code' => $user->address_postal_code,
            'address_lat' => $user->address_lat,
            'address_lng' => $user->address_lng,
        ];

        $mahasiswaMap = $mahasiswa ? [
            'nik' => $mahasiswa->nik,
            'mother_name' => $mahasiswa->mother_name,
            'gender' => $mahasiswa->gender,
            'shirt_size' => $mahasiswa->shirt_size,
            'birth_place' => $mahasiswa->birth_place,
            'birth_date' => $mahasiswa->birth_date?->toDateString(),
        ] : [];

        $dosenMap = $dosen ? [
            'nama_gelar' => $dosen->nama_gelar,
            'nidn' => $dosen->nidn,
            'dosen_nik' => $dosen->nik,
            'jabatan' => $dosen->jabatan,
            'kelas_jabatan' => $dosen->kelas_jabatan,
            'tugas_tambahan' => $dosen->tugas_tambahan,
            'golongan' => $dosen->golongan,
            'pangkat' => $dosen->pangkat,
            'no_rekening' => $dosen->no_rekening,
            'nama_bank' => $dosen->nama_bank,
            'npwp' => $dosen->npwp,
            'gender' => $dosen->gender,
            'birth_date' => $dosen->birth_date?->toDateString(),
            'dosen_alamat' => $dosen->alamat,
        ] : [];

        $currentValues = array_merge($userMap, $mahasiswaMap, $dosenMap);

        foreach ($validated as $field => $newValue) {
            if ($field === 'address_verified') {
                $oldVerified = filled($user->address_verified_at);
                $newVerified = (bool) $newValue;
                if ($oldVerified !== $newVerified) {
                    $changes['address_verified_at'] = ['old' => $user->address_verified_at?->toIso8601String(), 'new' => $newVerified ? now()->toIso8601String() : null];
                }

                continue;
            }
            $old = $currentValues[$field] ?? null;
            $new = $newValue;
            // Normalize for comparison
            if ((string) $old !== (string) $new) {
                $changes[$field] = ['old' => $old, 'new' => $new];
            }
        }

        if (empty($changes)) {
            return $this->badRequest('Tidak ada perubahan yang terdeteksi.');
        }

        $wasProfileComplete = $this->isProfileComplete($user);

        if (! $wasProfileComplete) {
            DB::transaction(function () use ($user, $changes, $mahasiswa, $dosen) {
                $this->applyProfileChanges($user, $changes, $mahasiswa, $dosen);
            });

            ActivityLogger::log('profile_update', 'success', $user->id, [
                'first_onboarding' => true,
                'fields_changed' => array_keys($changes),
            ]);

            return $this->success(null, 'Profil berhasil dilengkapi. Silakan lanjutkan menggunakan portal.');
        }

        // Block if there's already a pending request after onboarding is complete.
        $hasPending = ProfileChangeRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->exists();

        if ($hasPending) {
            return $this->badRequest('Anda sudah memiliki permintaan perubahan profil yang sedang menunggu persetujuan.');
        }

        ProfileChangeRequest::create([
            'user_id' => $user->id,
            'requested_changes' => $changes,
            'status' => 'pending',
        ]);

        ActivityLogger::log('profile_update', 'success', $user->id, [
            'pending_approval' => true,
            'fields_changed' => array_keys($changes),
        ]);

        return $this->success(null, 'Permintaan perubahan profil berhasil dikirim. Menunggu persetujuan superadmin.', 202);
    }

    private function isProfileComplete(User $user): bool
    {
        $user->loadMissing(['mahasiswa', 'dosen']);

        $baseComplete = filled($user->avatar)
            && filled($user->phone)
            && filled($user->address)
            && filled($user->address_village_name)
            && filled($user->address_district_name)
            && filled($user->address_regency_name)
            && filled($user->address_postal_code)
            && filled($user->address_lat)
            && filled($user->address_lng)
            && filled($user->address_verified_at);

        if (! $baseComplete) {
            return false;
        }

        if ($user->mahasiswa) {
            return filled($user->mahasiswa->nik)
                && filled($user->mahasiswa->mother_name)
                && filled($user->mahasiswa->birth_place)
                && filled($user->mahasiswa->birth_date)
                && filled($user->mahasiswa->gender)
                && filled($user->mahasiswa->shirt_size);
        }

        if ($user->dosen) {
            return filled($user->dosen->jabatan)
                && filled($user->dosen->golongan)
                && filled($user->dosen->no_rekening)
                && filled($user->dosen->nama_bank)
                && filled($user->dosen->npwp)
                && filled($user->dosen->gender)
                && filled($user->dosen->birth_date);
        }

        return true;
    }

    private function applyProfileChanges(User $user, array $changes, ?Mahasiswa $mahasiswa, ?Dosen $dosen): void
    {
        $userFields = ['name', 'email', 'phone', 'address', 'address_village_name', 'address_district_name', 'address_regency_name', 'address_postal_code', 'address_lat', 'address_lng', 'address_registered_at', 'address_verified_at'];
        $mahasiswaFields = ['nik', 'mother_name', 'gender', 'shirt_size', 'birth_place', 'birth_date'];
        $dosenFields = ['nama_gelar', 'nidn', 'dosen_nik', 'jabatan', 'kelas_jabatan', 'tugas_tambahan', 'golongan', 'pangkat', 'no_rekening', 'nama_bank', 'npwp', 'gender', 'birth_date', 'dosen_alamat'];

        $userUpdate = [];
        $mahasiswaUpdate = [];
        $dosenUpdate = [];

        foreach ($changes as $field => $value) {
            $new = is_array($value) ? ($value['new'] ?? null) : $value;
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
            // Field-lock registry: once the user / admin has set these
            // fields manually, SIAKAD sync MUST NOT overwrite them.
            // See App\Traits\HasManuallyEditedFields::lockFields.
            $user->lockFields(array_keys($userUpdate));
        }

        if ($mahasiswa && $mahasiswaUpdate) {
            $mahasiswa->fill($mahasiswaUpdate)->save();
            $mahasiswa->lockFields(array_keys($mahasiswaUpdate));
        }

        if ($dosen && $dosenUpdate) {
            $dosen->fill($dosenUpdate)->save();
            $dosen->lockFields(array_keys($dosenUpdate));
        }
    }

    public function updateAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'max:5120'],
        ]);

        $path = $request->file('avatar')->store('avatars', 'public');
        if (! is_string($path) || $path === '' || $path === '0') {
            return $this->error('Gagal menyimpan file foto. Silakan coba lagi atau hubungi admin.', 500);
        }

        $queueBackedValidation = config('queue.default') !== 'sync';
        $reason = $queueBackedValidation
            ? 'Sedang diverifikasi otomatis oleh sistem.'
            : 'Validasi otomatis belum tersedia; menunggu verifikasi admin.';

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $user->update([
            'avatar' => $path,
            'avatar_moderation_status' => 'pending',
            'avatar_moderation_reason' => $reason,
            'avatar_moderation_reviewed_at' => null,
            'avatar_moderation_reviewed_by' => null,
        ]);

        if ($queueBackedValidation) {
            ValidateAvatarUploadJob::dispatch($user->id, $path)->onQueue('long');
        } else {
            $result = app(AvatarValidationService::class)->validateAvatar($path);
            $user->refresh();

            if ($user->avatar === $path && $user->avatar_moderation_status === 'pending') {
                if (! $result['is_valid'] && ! $result['requires_manual_review']) {
                    Storage::disk('public')->delete($path);
                    $user->forceFill([
                        'avatar' => null,
                        'avatar_moderation_status' => 'rejected',
                        'avatar_moderation_reason' => $result['reason'] ?? 'Foto ditolak oleh sistem AI.',
                        'avatar_moderation_reviewed_at' => now(),
                        'avatar_moderation_reviewed_by' => null,
                    ])->save();
                } else {
                    $user->forceFill([
                        'avatar_moderation_status' => $result['requires_manual_review'] ? 'pending' : 'approved',
                        'avatar_moderation_reason' => $result['requires_manual_review']
                            ? 'Server AI tidak tersedia, menunggu verifikasi admin.'
                            : null,
                        'avatar_moderation_reviewed_at' => $result['requires_manual_review'] ? null : now(),
                        'avatar_moderation_reviewed_by' => null,
                    ])->save();
                }
            }
        }

        ActivityLogger::log('avatar_upload', 'success', $user->id, [
            'moderation_status' => 'pending',
        ]);

        $msg = $queueBackedValidation
            ? 'Foto berhasil diunggah dan sedang diverifikasi otomatis.'
            : 'Foto berhasil diunggah dan menunggu verifikasi admin.';

        return $this->success([
            'avatar_url' => asset('storage/'.$path),
            'moderation_status' => 'pending',
            'moderation_reason' => $reason,
        ], $msg);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $isFirstPasswordChange = $user->must_change_password || is_null($user->password_changed_at);

        $request->validate([
            'current_password' => [$isFirstPasswordChange ? 'nullable' : 'required', 'string'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        if (! $isFirstPasswordChange && ! Hash::check($request->input('current_password'), $user->password)) {
            ActivityLogger::log('password_change', 'failed', $user->id, [
                'reason' => 'invalid_current_password',
            ]);

            return $this->error('VALIDATION_ERROR', 'Kata sandi saat ini salah.', 422, [
                'current_password' => ['Kata sandi saat ini salah.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->input('password')),
            'password_changed_at' => now(),
            'must_change_password' => false,
        ]);

        // Revoke all existing Sanctum tokens so stolen tokens are invalidated
        $user->tokens()->delete();

        ActivityLogger::log('password_change', 'success', $user->id, [
            'first_time' => $isFirstPasswordChange,
        ]);

        $user->loadMissing(['roles', 'mahasiswa', 'dosen', 'fakultas']);

        if ($request->header('X-App-Type') === 'mobile') {
            $token = $user->createToken('mobile')->plainTextToken;

            return $this->success([
                'token' => $token,
                'token_type' => 'Bearer',
                'user' => new UserResource($user->refresh()),
            ], 'Kata sandi berhasil diubah.');
        }

        // Web: return 200 with user data + new cookie (not 204)
        // 204 No Content can cause browsers to skip Set-Cookie processing,
        // breaking the auth flow after password change.
        $token = $user->createToken('web')->plainTextToken;
        $isSecure = app()->environment('production') ? true : $request->secure();
        $expiry = 60 * 60 * 24 * 7;

        return $this->success([
            'user' => new UserResource($user->refresh()),
        ], 'Kata sandi berhasil diubah.')
            ->withCookie(cookie('sibermas_token', $token, $expiry / 60, '/', null, $isSecure, true, false, 'Strict'));
    }

    /**
     * GET /v1/profile/notification-preferences
     *
     * Returns the effective preferences (user overrides merged over defaults),
     * plus the raw stored preferences so the UI can distinguish "using default"
     * from "explicitly set to default".
     */
    public function notificationPreferences(Request $request): JsonResponse
    {
        $user = $request->user();

        return $this->success([
            'preferences' => $user->notificationPreferences(),
            'raw' => $user->notification_preferences,
            'defaults' => [
                'in_app' => SystemSetting::get('notification_default_in_app', '1') !== '0',
                'email' => SystemSetting::get('notification_default_email', '1') !== '0',
                'push' => SystemSetting::get('notification_default_push', '1') !== '0',
            ],
        ]);
    }

    /**
     * PATCH /v1/profile/notification-preferences
     *
     * Partial update — fields omitted from the request keep their current
     * value. To reset to defaults, PATCH with `{ "reset": true }`.
     */
    public function updateNotificationPreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'in_app' => ['sometimes', 'boolean'],
            'email' => ['sometimes', 'boolean'],
            'push' => ['sometimes', 'boolean'],
            'reset' => ['sometimes', 'boolean'],
        ]);

        $user = $request->user();

        if (! empty($validated['reset'])) {
            $user->notification_preferences = null;
        } else {
            $current = $user->notification_preferences ?? [];
            $merged = array_merge(
                is_array($current) ? $current : [],
                array_intersect_key($validated, array_flip(['in_app', 'email', 'push'])),
            );
            $user->notification_preferences = $merged;
        }

        $user->save();

        return $this->success([
            'preferences' => $user->notificationPreferences(),
            'raw' => $user->notification_preferences,
        ], 'Preferensi notifikasi diperbarui.');
    }
}
