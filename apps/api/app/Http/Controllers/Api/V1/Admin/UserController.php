<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DosenResource;
use App\Http\Resources\Api\V1\MahasiswaResource;
use App\Http\Resources\Api\V1\UserResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Dosen;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = User::with(['fakultas', 'roles'])->when($request->input('search'), fn ($q, $s) => $q->where('name', 'like', "%{$s}%")->orWhere('username', 'like', "%{$s}%"))->when($request->input('role'), fn ($q, $r) => $q->role($r))->orderByDesc('created_at');

        return $this->successCollection(UserResource::collection($query->paginate(25)));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'unique:users,email'],
            'password' => ['required', 'string', User::PASSWORD_REQUIREMENTS],
            'role' => ['required', 'string', Rule::in(['superadmin', 'admin', 'faculty_admin', 'dosen', 'dpl', 'student'])],
            'fakultas_id' => ['nullable', 'exists:fakultas,id'],
        ]);
        $user = User::create(['username' => $validated['username'], 'name' => $validated['name'], 'email' => $validated['email'] ?? null, 'password' => Hash::make($validated['password']), 'must_change_password' => true, 'is_active' => true, 'fakultas_id' => $validated['fakultas_id'] ?? null]);
        $user->assignRole($validated['role']);

        return $this->created(new UserResource($user->load('roles')), 'Pengguna berhasil ditambahkan.');
    }

    public function toggleActive(User $user): JsonResponse
    {
        $user->update(['is_active' => ! $user->is_active]);

        return $this->success(new UserResource($user->refresh()), 'Status pengguna berhasil diubah.');
    }

    public function update(Request $request, User $user): JsonResponse
    {
        if (! auth()->user()?->hasRole('superadmin')) {
            return $this->forbidden('Hanya superadmin yang dapat mengubah data pengguna.');
        }

        $validated = $request->validate([
            'username' => ['required', 'string', 'max:255', Rule::unique('users', 'username')->ignore($user->id)],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'is_active' => ['nullable', 'boolean'],
            'fakultas_id' => ['nullable', 'exists:fakultas,id'],
        ]);

        $user->fill([
            'username' => $validated['username'],
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'fakultas_id' => $validated['fakultas_id'] ?? null,
        ]);

        if (array_key_exists('is_active', $validated)) {
            $user->is_active = (bool) $validated['is_active'];
        }

        $user->save();

        return $this->success(new UserResource($user->refresh()->load(['roles', 'fakultas'])), 'Data pengguna berhasil diperbarui.');
    }

    public function resetTemporaryPassword(User $user): JsonResponse
    {
        if (! auth()->user()?->hasRole('superadmin')) {
            return $this->forbidden('Hanya superadmin yang dapat mereset password pengguna.');
        }

        $tempPassword = Str::random(12);
        $user->update(['password' => Hash::make($tempPassword), 'must_change_password' => true]);

        // Send password via email if available; never return plaintext in JSON response
        if ($user->email) {
            try {
                Mail::raw(
                    "Password sementara akun {$user->username}: {$tempPassword}\n\nSilakan ganti password setelah login.",
                    fn ($m) => $m->to($user->email)->subject('Password Sementara SIBERMAS')
                );
            } catch (\Throwable) {
                // Mail failure should not block the response
            }
        }

        return $this->success(
            ['username' => $user->username, 'email_sent' => (bool) $user->email],
            'Password sementara berhasil dibuat.'.($user->email ? ' Dikirim ke email.' : ' Tidak ada email terdaftar.')
        );
    }

    public function updateRole(Request $request, User $user): JsonResponse
    {
        if (! auth()->user()?->hasRole('superadmin')) {
            return $this->forbidden('Hanya superadmin yang dapat mengubah role pengguna.');
        }

        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(['superadmin', 'admin', 'faculty_admin', 'dosen', 'dpl', 'student'])],
        ]);

        // Cegah superadmin menghapus role superadminnya sendiri jika dia satu-satunya
        if ($user->id === auth()->id() && $user->hasRole('superadmin') && $validated['role'] !== 'superadmin') {
            return $this->error('FORBIDDEN', 'Anda tidak dapat mengubah role superadmin Anda sendiri.', 403);
        }

        $user->syncRoles([$validated['role']]);

        return $this->success(new UserResource($user->refresh()->load('roles')), 'Role pengguna berhasil diperbarui.');
    }

    public function mahasiswaIndex(Request $request): JsonResponse
    {
        $query = Mahasiswa::with(['user', 'fakultas', 'prodi'])
            ->when($request->input('search'), function ($q, $s) {
                // nim encrypted — LIKE won't match ciphertext. Fall back to
                // nama partial match + exact nim via blind index.
                $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $s);
                $q->where('nama', 'like', "%{$escaped}%");
                if (preg_match('/^\d{6,20}$/', trim($s))) {
                    $q->orWhere('nim_bidx', Mahasiswa::computeBlindIndex(trim($s)));
                }
            })
            ->when($request->input('fakultas_id'), fn ($q, $id) => $q->where('fakultas_id', $id))
            ->orderByDesc('created_at');

        return $this->successCollection(MahasiswaResource::collection($query->paginate(25)));
    }

    public function mahasiswaShow(Mahasiswa $mahasiswa): JsonResponse
    {
        $mahasiswa->load(['user', 'fakultas', 'prodi', 'peserta.kelompok']);

        return $this->success(new MahasiswaResource($mahasiswa));
    }

    public function dosenIndex(Request $request): JsonResponse
    {
        $query = Dosen::with(['user', 'fakultas'])
            ->when($request->input('search'), function ($q, $s) {
                // nip encrypted — same blind-index pattern as mahasiswa.nim.
                $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $s);
                $q->where('nama', 'like', "%{$escaped}%");
                if (preg_match('/^\d{6,20}$/', trim($s))) {
                    $q->orWhere('nip_bidx', Dosen::computeBlindIndex(trim($s)));
                }
            })
            ->orderBy('nama');

        return $this->successCollection(DosenResource::collection($query->paginate(25)));
    }

    public function transfer(Request $request): JsonResponse
    {
        $request->validate(['peserta_kkn_id' => ['required', 'exists:peserta_kkn,id'], 'target_kelompok_id' => ['required', 'exists:kelompok_kkn,id']]);
        $peserta = PesertaKkn::findOrFail($request->input('peserta_kkn_id'));
        $peserta->update(['kelompok_id' => $request->input('target_kelompok_id'), 'joined_group_at' => now()]);

        return $this->success(['id' => $peserta->id], 'Mahasiswa berhasil dipindahkan.');
    }
}
