<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\UserResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Dosen;
use App\Models\KKN\Mahasiswa;
use App\Models\User;
use App\Services\ProfileSnapshotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    use ApiResponse;

    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load(['mahasiswa.fakultas', 'mahasiswa.prodi', 'dosen.fakultas', 'fakultas']);

        return $this->success(new UserResource($user));
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'                   => ['sometimes', 'string', 'max:255'],
            'phone'                  => ['nullable', 'string', 'max:20'],
            'address'                => ['nullable', 'string', 'max:500'],
            'domicile_village_name'  => ['nullable', 'string', 'max:150'],
            'domicile_district_name' => ['nullable', 'string', 'max:150'],
            'domicile_regency_name'  => ['nullable', 'string', 'max:150'],
            'address_verified'       => ['nullable', 'boolean'],
            // Mahasiswa biodata
            'nik'                    => ['nullable', 'regex:/^\d{16}$/'],
            'mother_name'            => ['nullable', 'string', 'max:150'],
            'gender'                 => ['nullable', 'in:L,P'],
            'shirt_size'             => ['nullable', 'string', 'max:10'],
            'birth_place'            => ['nullable', 'string', 'max:100'],
            'birth_date'             => ['nullable', 'date'],
            // Dosen fields
            'jabatan'                => ['nullable', 'string', 'max:100'],
            'golongan'               => ['nullable', 'string', 'max:50'],
            'no_rekening'            => ['nullable', 'string', 'max:50'],
            'nama_bank'              => ['nullable', 'string', 'max:100'],
            'npwp'                   => ['nullable', 'string', 'max:50'],
        ]);

        $requestedAddressVerified = (bool) ($validated['address_verified'] ?? false);
        $addressFields = [
            'address'                => $validated['address'] ?? null,
            'domicile_village_name'  => $validated['domicile_village_name'] ?? null,
            'domicile_district_name' => $validated['domicile_district_name'] ?? null,
            'domicile_regency_name'  => $validated['domicile_regency_name'] ?? null,
        ];

        if ($requestedAddressVerified && collect($addressFields)->contains(fn ($v) => blank($v))) {
            return $this->validationError(
                ['address_verified' => ['Lengkapi alamat domisili, desa/kelurahan, kecamatan, dan kabupaten/kota sebelum melakukan verifikasi alamat.']],
                'Lengkapi alamat domisili terlebih dahulu.'
            );
        }

        DB::transaction(function () use ($user, $validated, $requestedAddressVerified) {
            $addressChanged = $user->address !== ($validated['address'] ?? null)
                || $user->domicile_village_name !== ($validated['domicile_village_name'] ?? null)
                || $user->domicile_district_name !== ($validated['domicile_district_name'] ?? null)
                || $user->domicile_regency_name !== ($validated['domicile_regency_name'] ?? null);

            $user->fill([
                'name'                   => $validated['name'] ?? $user->name,
                'phone'                  => $validated['phone'] ?? null,
                'address'                => $validated['address'] ?? null,
                'domicile_village_name'  => $validated['domicile_village_name'] ?? null,
                'domicile_district_name' => $validated['domicile_district_name'] ?? null,
                'domicile_regency_name'  => $validated['domicile_regency_name'] ?? null,
            ]);

            if (! $requestedAddressVerified) {
                $user->address_verified_at = null;
            } elseif ($addressChanged || ! $user->address_verified_at) {
                $user->address_verified_at = now();
            }

            $user->save();

            if ($user->mahasiswa) {
                $mahasiswa = Mahasiswa::where('user_id', $user->id)->lockForUpdate()->first();
                if ($mahasiswa) {
                    $mahasiswa->fill([
                        'nama'        => $validated['name'] ?? $mahasiswa->nama,
                        'nik'         => $validated['nik'] ?? null,
                        'mother_name' => $validated['mother_name'] ?? null,
                        'gender'      => $validated['gender'] ?? $mahasiswa->gender,
                        'shirt_size'  => $validated['shirt_size'] ?? null,
                        'birth_place' => $validated['birth_place'] ?? null,
                        'birth_date'  => $validated['birth_date'] ?? null,
                    ]);
                    $mahasiswa->save();
                }
            } elseif ($user->dosen) {
                $dosen = Dosen::where('user_id', $user->id)->lockForUpdate()->first();
                if ($dosen) {
                    $dosen->fill([
                        'nama'        => $validated['name'] ?? $dosen->nama,
                        'jabatan'     => $validated['jabatan'] ?? $dosen->jabatan,
                        'golongan'    => $validated['golongan'] ?? $dosen->golongan,
                        'no_rekening' => $validated['no_rekening'] ?? $dosen->no_rekening,
                        'nama_bank'   => $validated['nama_bank'] ?? $dosen->nama_bank,
                        'npwp'        => $validated['npwp'] ?? $dosen->npwp,
                    ]);
                    $dosen->save();
                }
            }

            app(ProfileSnapshotService::class)->sync($user);
        });

        $user->refresh()->load(['mahasiswa.fakultas', 'mahasiswa.prodi', 'dosen.fakultas', 'fakultas']);

        return $this->success(new UserResource($user), 'Profil berhasil diperbarui.');
    }

    public function updateAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if ($user->avatar) {
            Storage::disk(config('filesystems.default'))->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', config('filesystems.default'));
        $user->update(['avatar' => $path]);

        return $this->success(['avatar_url' => asset('storage/'.$path)], 'Foto profil berhasil diperbarui.');
    }

    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'current_password' => ['required', 'string'],
            'password'         => ['required', 'confirmed', Password::defaults()],
        ]);

        if (! Hash::check($request->input('current_password'), $user->password)) {
            return $this->error('VALIDATION_ERROR', 'Kata sandi saat ini salah.', 422, [
                'current_password' => ['Kata sandi saat ini salah.'],
            ]);
        }

        $user->update([
            'password'             => Hash::make($request->input('password')),
            'password_changed_at'  => now(),
            'must_change_password' => false,
        ]);

        return $this->noContent('Kata sandi berhasil diubah.');
    }
}
