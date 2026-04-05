<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
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

        $missingBpjsFields = collect($requiredBpjsFields)
            ->filter(fn ($value) => blank($value))
            ->keys()
            ->map(fn (string $key) => $labels[$key] ?? $key)
            ->values()
            ->all();

        return Inertia::render('Profile/Show', [
            'user' => $user->only([
                'id',
                'name',
                'email',
                'username',
                'avatar',
                'phone',
                'address',
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
                'birth_place' => $student->birth_place,
                'birth_date' => optional($student->birth_date)?->toDateString(),
                'bpjs_complete' => $missingBpjsFields === [],
                'missing_bpjs_fields' => $missingBpjsFields,
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
            'nik' => ['nullable', 'regex:/^\d{16}$/'],
            'mother_name' => ['nullable', 'string', 'max:150'],
            'gender' => ['nullable', 'in:L,P'],
            'birth_place' => ['nullable', 'string', 'max:100'],
            'birth_date' => ['nullable', 'date'],
        ]);

        $user = $request->user();
        DB::transaction(function () use ($user, $validated) {
            $user->fill([
                'name' => $validated['name'],
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
            ]);
            $user->save();

            if ($user->mahasiswa) {
                $user->mahasiswa->fill([
                    'nama' => $validated['name'],
                    'nik' => $validated['nik'] ?? null,
                    'mother_name' => $validated['mother_name'] ?? null,
                    'gender' => $validated['gender'] ?? $user->mahasiswa->gender,
                    'birth_place' => $validated['birth_place'] ?? null,
                    'birth_date' => $validated['birth_date'] ?? null,
                ]);
                $user->mahasiswa->save();
            }
        });

        return redirect()->back()->with('success', 'Profil berhasil diperbarui.');
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
