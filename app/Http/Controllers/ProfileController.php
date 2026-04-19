<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
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
    private function isProfileComplete(User $user): bool
    {
        // REQUIRED: only Avatar (upload by user)
        // All other data comes from API Kampus (automatically synced)
        if (! filled($user->avatar)) {
            return false;
        }

        // REQUIRED: contact info (user must fill - may not from API)
        if (! filled($user->phone)) {
            return false;
        }

        if (! filled($user->address)) {
            return false;
        }

        if (! filled($user->domicile_village_name) ||
            ! filled($user->domicile_district_name) ||
            ! filled($user->domicile_regency_name)) {
            return false;
        }

        if (! filled($user->address_verified_at)) {
            return false;
        }

        // All biodata for both Student and Dosen comes from API Kampus
        // No manual check needed

        return true;
    }

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
        $user = auth()->user();
        if (!$user) {
            abort(401, 'Unauthorized');
        }
        
        $user->loadMissing(['mahasiswa.fakultas', 'mahasiswa.prodi', 'dosen.fakultas']);
        $student = $user->mahasiswa;
        $lecturer = $user->dosen;
        
        $requiredBiodataFields = [];
        $labels = [];

        if ($student) {
            $requiredBiodataFields = [
                'nik' => $student->nik,
                'mother_name' => $student->mother_name,
                'birth_place' => $student->birth_place,
                'birth_date' => optional($student->birth_date)?->toDateString(),
                'gender' => $student->gender,
                'shirt_size' => $student->shirt_size,
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
        } elseif ($lecturer) {
             $requiredBiodataFields = [
                'nip' => $lecturer->nip,
                'nama' => $lecturer->nama,
                'jabatan' => $lecturer->jabatan,
                'gender' => $lecturer->gender,
                'birth_date' => optional($lecturer->birth_date)?->toDateString(),
                'phone' => $user->phone,
            ];
            $labels = [
                'nip' => 'NIP',
                'nama' => 'Nama lengkap',
                'jabatan' => 'Jabatan fungsional',
                'gender' => 'Jenis kelamin',
                'birth_date' => 'Tanggal lahir',
                'phone' => 'Nomor WhatsApp',
            ];
        }

        $missingBiodataFields = collect($requiredBiodataFields)
            ->filter(fn ($value) => blank($value))
            ->keys()
            ->map(fn (string $key) => $labels[$key] ?? $key)
            ->values()
            ->all();

        $domicileSummary = $this->domicileSummary($user);

        // Onboarding mode: user belum pernah verifikasi alamat OR is still locked due to incomplete profile
        $isOnboarding = ! filled($user->address_verified_at) || $user->must_change_password;

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
            'is_onboarding' => $isOnboarding,
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
            'lecturer' => $lecturer ? [
                'nip' => $lecturer->nip,
                'nama' => $lecturer->nama,
                'jabatan' => $lecturer->jabatan,
                'gender' => $lecturer->gender,
                'is_cpns' => (bool) $lecturer->is_cpns,
                'is_tugas_belajar' => (bool) $lecturer->is_tugas_belajar,
                'faculty' => $lecturer->fakultas?->nama,
                'birth_date' => optional($lecturer->birth_date)?->toDateString(),
                'biodata_complete' => $missingBiodataFields === [],
                'missing_biodata_fields' => $missingBiodataFields,
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
        $wasOnboarding = ! filled($user->address_verified_at);
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

        // Check if profile is now complete → unlock and redirect to Daftar
        if ($this->isProfileComplete($user)) {
            $user->update(['must_change_password' => false]);

            return redirect('/mahasiswa/daftar')->with('success', 'Profil lengkap! Silakan pilih periode KKN untuk mendaftar.');
        }

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

        // Check if profile is now complete → unlock and redirect
        if ($this->isProfileComplete($user)) {
            $user->update(['must_change_password' => false]);

            // Redirect based on role
            if ($user->hasRole('student')) {
                return redirect('/mahasiswa/daftar')->with('success', 'Profil lengkap! Silakan pilih periode KKN untuk mendaftar.');
            }

            return redirect('/dpl/dashboard')->with('success', 'Profil lengkap! Selamat datang di SIM-KKN.');
        }

        return redirect()->back()->with('success', 'Foto profil berhasil diperbarui.');
    }

    /**
     * Update the user's password.
     */
    public function updatePassword(Request $request): RedirectResponse
    {
        $user = $request->user();
        $hasNeverChangedPassword = is_null($user->password_changed_at);

        $rules = [
            'password' => ['required', Password::min(8)->mixedCase()->numbers()->symbols(), 'confirmed'],
        ];

        if (!$hasNeverChangedPassword) {
            $rules['current_password'] = ['required', 'current_password'];
        }

        $validated = $request->validate($rules);

        $user->update([
            'password' => Hash::make($validated['password']),
            'password_changed_at' => now(),
        ]);

        // If this was first password change OR profile incomplete → check profile completeness
        if ($hasNeverChangedPassword || $user->must_change_password) {
            // Use unified method - works for both student and lecturer
            // Note: All biodata comes from API, only profile + contact info required
            if ($this->isProfileComplete($user)) {
                $user->update(['must_change_password' => false]);

                // Redirect based on role
                if ($user->hasRole('student')) {
                    return redirect('/mahasiswa/daftar')->with('success', 'Profil lengkap! Selamat datang di SIM-KKN.');
                }

                return redirect('/dpl/dashboard')->with('success', 'Profil lengkap! Selamat datang di SIM-KKN.');
            }

            // If incomplete → STAY LOCKED but still unlocked password (password now changed)
            if ($hasNeverChangedPassword) {
                $user->update(['must_change_password' => true]);
            }

            // Get specific missing fields (only profile/contact - biodata from API)
            $missing = [];

            if (! filled($user->avatar)) { $missing[] = 'Foto Profil'; }
            if (! filled($user->phone)) { $missing[] = 'Nomor HP'; }
            if (! filled($user->address)) { $missing[] = 'Alamat'; }
            if (! filled($user->domicile_village_name)) { $missing[] = 'Desa/Kelurahan'; }
            if (! filled($user->domicile_district_name)) { $missing[] = 'Kecamatan'; }
            if (! filled($user->domicile_regency_name)) { $missing[] = 'Kabupaten/Kota'; }
            if (! filled($user->address_verified_at)) { $missing[] = 'Verifikasi Alamat'; }

            return redirect()->route('profile.show')->with('error', 'Profil belum lengkap! '.implode(', ', $missing).' wajib diisi.');
        }

        return redirect()->back()->with('success', 'Password berhasil diubah.');
    }

    /**
     * Check if NIK is already used by another user.
     */
    public function checkNik(Request $request)
    {
        $nik = $request->query('nik', '');

        if (strlen($nik) !== 16 || !ctype_digit($nik)) {
            return response()->json(['valid' => false, 'message' => 'NIK harus 16 digit angka']);
        }

        $currentUserId = auth()->id();

        $exists = DB::table('mahasiswa')
            ->where('nik', $nik)
            ->where('user_id', '!=', $currentUserId)
            ->exists();

        if ($exists) {
            return response()->json([
                'valid' => false,
                'message' => 'NIK ini sudah digunakan oleh pengguna lain'
            ]);
        }

        return response()->json(['valid' => true, 'message' => 'NIK tersedia']);
    }

    public function passwordChange(): Response|\Illuminate\Http\RedirectResponse
    {
        $user = auth()->user();

        if (! $user->must_change_password) {
            return redirect()->route('profile.show')->with('info', 'Kata sandi Anda sudah diperbarui.');
        }

        return Inertia::render('Profile/PasswordChange', [
            'user' => $user->only(['id', 'name', 'email', 'username', 'must_change_password']),
            'mustChangePassword' => $user->must_change_password,
        ]);
    }
}
