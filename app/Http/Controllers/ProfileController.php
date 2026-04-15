<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\KKN\Mahasiswa;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    private function domicileSummary(User $user): array
    {
        $required = [
            'address' => $user->address,
            'domicile_village_name' => $user->domicile_village_name,
            'domicile_district_name' => $user->domicile_district_name,
            'domicile_regency_name' => $user->domicile_regency_name,
        ];

        $labels = [
            'address' => 'Alamat lengkap domisili',
            'domicile_village_name' => 'Desa/Kelurahan domisili',
            'domicile_district_name' => 'Kecamatan domisili',
            'domicile_regency_name' => 'Kabupaten/Kota domisili',
        ];

        $missing = collect($required)
            ->filter(fn ($value) => blank($value))
            ->keys()
            ->map(fn (string $key) => $labels[$key] ?? $key)
            ->values()
            ->all();

        return [
            'is_complete' => $missing === [] && filled($user->address_verified_at),
            'is_verified' => filled($user->address_verified_at),
            'verified_at' => $user->address_verified_at?->toIso8601String(),
            'missing_fields' => $missing,
        ];
    }

    /**
     * Display the user's profile.
     */
    public function show(): Response
    {
        $user = auth()->user()->loadMissing(['mahasiswa.fakultas', 'mahasiswa.prodi']);
        $student = $user->mahasiswa;

        $requiredBpjsFields = [
            'nik' => $student?->nik,
            'mother_name' => $student?->mother_name,
            'birth_place' => $student?->birth_place,
            'birth_date' => optional($student?->birth_date)?->toDateString(),
            'gender' => $student?->gender,
            'shirt_size' => $student?->shirt_size,
            'phone' => $user->phone,
            'address' => $user->address,
        ];
        $labels = [
            'nik' => 'NIK',
            'mother_name' => 'Nama ibu kandung',
            'birth_place' => 'Tempat lahir',
            'birth_date' => 'Tanggal lahir',
            'gender' => 'Jenis kelamin',
            'phone' => 'Nomor WhatsApp',
            'address' => 'Alamat lengkap',
        ];

        $missingBiodataFields = collect($requiredBpjsFields)
            ->filter(fn ($value) => blank($value))
            ->keys()
            ->map(fn (string $key) => $labels[$key] ?? $key)
            ->values()
            ->all();

        $domicileSummary = $this->domicileSummary($user);

        return Inertia::render('Profile/Show', [
            'user' => $user->only([
                'id',
                'name',
                'email',
                'username',
                'avatar',
                'phone',
                'address',
                'domicile_village_name',
                'domicile_district_name',
                'domicile_regency_name',
                'address_verified_at',
                'must_change_password',
            ]),
            'student' => $student ? [
                'nim' => $student->nim,
                'nik' => $student->nik,
                'name' => $student->nama,
                'mother_name' => $student->mother_name,
                'faculty' => $student->fakultas?->nama ?? $student->prodi?->fakultas?->nama,
                'program' => $student->prodi?->nama,
                'batch_year' => $student->batch_year,
                'gender' => $student->gender,
                'shirt_size' => $student->shirt_size,
                'birth_place' => $student->birth_place,
                'birth_date' => optional($student->birth_date)?->toDateString(),
                'semester' => $student->semester,
                'gpa' => $student->gpa,
                'sks_completed' => $student->sks_completed,
                'biodata_complete' => $missingBiodataFields === [],
                'missing_biodata_fields' => $missingBiodataFields,
                'domicile_complete' => $domicileSummary['is_complete'],
                'domicile_verified' => $domicileSummary['is_verified'],
                'domicile_verified_at' => $domicileSummary['verified_at'],
                'missing_domicile_fields' => $domicileSummary['missing_fields'],
            ] : null,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],
            'domicile_village_name' => ['nullable', 'string', 'max:150'],
            'domicile_district_name' => ['nullable', 'string', 'max:150'],
            'domicile_regency_name' => ['nullable', 'string', 'max:150'],
            'address_verified' => ['nullable', 'boolean'],
            'nik' => ['nullable', 'regex:/^\d{16}$/'],
            'mother_name' => ['nullable', 'string', 'max:150'],
            'gender' => ['nullable', 'in:L,P'],
            'shirt_size' => ['nullable', 'string', 'max:10'],
            'birth_place' => ['nullable', 'string', 'max:100'],
            'birth_date' => ['nullable', 'date'],
        ]);

        $user = $request->user();
        $requestedAddressVerified = (bool) ($validated['address_verified'] ?? false);
        $addressFields = [
            'address' => $validated['address'] ?? null,
            'domicile_village_name' => $validated['domicile_village_name'] ?? null,
            'domicile_district_name' => $validated['domicile_district_name'] ?? null,
            'domicile_regency_name' => $validated['domicile_regency_name'] ?? null,
        ];

        if ($requestedAddressVerified && collect($addressFields)->contains(fn ($value) => blank($value))) {
            return redirect()->back()->withErrors([
                'address_verified' => 'Lengkapi alamat domisili, desa/kelurahan, kecamatan, dan kabupaten/kota sebelum melakukan verifikasi alamat.',
            ]);
        }

        DB::transaction(function () use ($user, $validated) {
            $addressChanged = $user->address !== ($validated['address'] ?? null)
                || $user->domicile_village_name !== ($validated['domicile_village_name'] ?? null)
                || $user->domicile_district_name !== ($validated['domicile_district_name'] ?? null)
                || $user->domicile_regency_name !== ($validated['domicile_regency_name'] ?? null);
            $requestedAddressVerified = (bool) ($validated['address_verified'] ?? false);

            $user->fill([
                'name' => $validated['name'],
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'domicile_village_name' => $validated['domicile_village_name'] ?? null,
                'domicile_district_name' => $validated['domicile_district_name'] ?? null,
                'domicile_regency_name' => $validated['domicile_regency_name'] ?? null,
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
                        'nama' => $validated['name'],
                        'nik' => $validated['nik'] ?? null,
                        'mother_name' => $validated['mother_name'] ?? null,
                        'gender' => $validated['gender'] ?? $mahasiswa->gender,
                        'shirt_size' => $validated['shirt_size'] ?? null,
                        'birth_place' => $validated['birth_place'] ?? null,
                        'birth_date' => $validated['birth_date'] ?? null,
                    ]);
                    $mahasiswa->save();
                }
            }
        });

        return redirect()->back()->with('success', 'Profil dan domisili berhasil diperbarui.');
    }

    /**
     * Update the user's avatar.
     */
    public function updateAvatar(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $user = $request->user();

        // Delete old avatar if exists
        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->avatar = $path;
        $user->save();

        return redirect()->back()->with('success', 'Foto profil berhasil diperbarui.');
    }

    /**
     * Update the user's password.
     */
    public function updatePassword(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::min(8)->mixedCase()->numbers()->symbols(), 'confirmed'],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
            'must_change_password' => false,
            'password_changed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Password berhasil diubah.');
    }
}
