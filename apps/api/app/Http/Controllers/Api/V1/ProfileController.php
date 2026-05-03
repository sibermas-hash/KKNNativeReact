<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\UserResource;
use App\Http\Traits\ApiResponse;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/profile
     */
    public function show(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->load(['mahasiswa.fakultas', 'mahasiswa.prodi', 'dosen.fakultas', 'fakultas']);

        return $this->success(new UserResource($user));
    }

    /**
     * PATCH /api/v1/profile
     */
    public function update(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],
            'domicile_village_name' => ['nullable', 'string', 'max:255'],
            'domicile_district_name' => ['nullable', 'string', 'max:255'],
            'domicile_regency_name' => ['nullable', 'string', 'max:255'],
        ]);

        $user->update($validated);

        $user->load(['mahasiswa.fakultas', 'mahasiswa.prodi', 'dosen.fakultas', 'fakultas']);

        return $this->success(new UserResource($user->refresh()), 'Profil berhasil diperbarui.');
    }

    /**
     * POST /api/v1/profile/avatar
     */
    public function updateAvatar(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        // Delete old avatar
        if ($user->avatar) {
            Storage::disk(config('filesystems.default'))->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', config('filesystems.default'));
        $user->update(['avatar' => $path]);

        return $this->success([
            'avatar_url' => asset('storage/' . $path),
        ], 'Foto profil berhasil diperbarui.');
    }

    /**
     * PATCH /api/v1/profile/password
     */
    public function changePassword(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        if (! Hash::check($request->input('current_password'), $user->password)) {
            return $this->error('VALIDATION_ERROR', 'Kata sandi saat ini salah.', 422, [
                'current_password' => ['Kata sandi saat ini salah.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->input('password')),
            'password_changed_at' => now(),
            'must_change_password' => false,
        ]);

        return $this->noContent('Kata sandi berhasil diubah.');
    }
}
