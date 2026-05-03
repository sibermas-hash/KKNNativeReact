<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\UserResource;
use App\Http\Resources\Api\V1\MahasiswaResource;
use App\Http\Resources\Api\V1\DosenResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Dosen;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

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
        $validated = $request->validate(['username' => ['required', 'string', 'max:255', 'unique:users,username'], 'name' => ['required', 'string', 'max:255'], 'email' => ['nullable', 'email', 'unique:users,email'], 'password' => ['required', 'string', 'min:8'], 'role' => ['required', 'string'], 'fakultas_id' => ['nullable', 'exists:fakultas,id']]);
        $user = User::create(['username' => $validated['username'], 'name' => $validated['name'], 'email' => $validated['email'] ?? null, 'password' => Hash::make($validated['password']), 'must_change_password' => true, 'is_active' => true, 'fakultas_id' => $validated['fakultas_id'] ?? null]);
        $user->assignRole($validated['role']);
        return $this->created(new UserResource($user->load('roles')), 'Pengguna berhasil ditambahkan.');
    }

    public function toggleActive(User $user): JsonResponse
    {
        $user->update(['is_active' => ! $user->is_active]);
        return $this->success(new UserResource($user->refresh()), 'Status pengguna berhasil diubah.');
    }

    public function resetTemporaryPassword(User $user): JsonResponse
    {
        $tempPassword = Str::random(12);
        $user->update(['password' => Hash::make($tempPassword), 'must_change_password' => true]);
        return $this->success(['temporary_username' => $user->username, 'temporary_password' => $tempPassword], 'Password sementara berhasil dibuat.');
    }

    public function mahasiswaIndex(Request $request): JsonResponse
    {
        $query = Mahasiswa::with(['user', 'fakultas', 'prodi'])->when($request->input('search'), fn ($q, $s) => $q->where('nama', 'like', "%{$s}%")->orWhere('nim', 'like', "%{$s}%"))->when($request->input('fakultas_id'), fn ($q, $id) => $q->where('fakultas_id', $id))->orderByDesc('created_at');
        return $this->successCollection(MahasiswaResource::collection($query->paginate(25)));
    }

    public function mahasiswaShow(Mahasiswa $mahasiswa): JsonResponse
    {
        $mahasiswa->load(['user', 'fakultas', 'prodi', 'peserta.kelompok']);
        return $this->success(new MahasiswaResource($mahasiswa));
    }

    public function dosenIndex(Request $request): JsonResponse
    {
        $query = Dosen::with(['user', 'fakultas'])->when($request->input('search'), fn ($q, $s) => $q->where('nama', 'like', "%{$s}%")->orWhere('nip', 'like', "%{$s}%"))->orderBy('nama');
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
