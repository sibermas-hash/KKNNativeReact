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
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min((int) $request->input('per_page', 25), 100));

        $query = User::with(['fakultas', 'roles'])
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = trim((string) $request->input('search'));

                $q->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->input('role'), fn ($q, $r) => $q->role($r))
            ->orderByDesc('created_at');

        return $this->successCollection(UserResource::collection($query->paginate($perPage)->withQueryString()));
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

    /**
     * Detail user + mahasiswa/dosen payload untuk modal "Ubah Data" di admin.
     * Superadmin only. Return union struct dengan relasi optional.
     */
    public function show(User $user): JsonResponse
    {
        if (! auth()->user()?->hasRole('superadmin')) {
            return $this->forbidden('Hanya superadmin yang dapat melihat detail pengguna.');
        }

        $user->load(['roles', 'fakultas']);
        $mahasiswa = Mahasiswa::where('user_id', $user->id)->with(['fakultas', 'prodi'])->first();
        $dosen = Dosen::where('user_id', $user->id)->with(['fakultas'])->first();

        return $this->success([
            'user' => new UserResource($user),
            'mahasiswa' => $mahasiswa !== null ? new MahasiswaResource($mahasiswa) : null,
            'dosen' => $dosen !== null ? new DosenResource($dosen) : null,
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        if (! auth()->user()?->hasRole('superadmin')) {
            return $this->forbidden('Hanya superadmin yang dapat mengubah data pengguna.');
        }

        // User-level fields (berlaku untuk semua role).
        $validated = $request->validate([
            'username' => ['sometimes', 'string', 'max:255', Rule::unique('users', 'username')->ignore($user->id)],
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'nullable', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'is_active' => ['sometimes', 'boolean'],
            'fakultas_id' => ['sometimes', 'nullable', 'exists:fakultas,id'],
        ]);

        // Mahasiswa fields — NIM di-LOCK, tidak boleh diubah lewat endpoint ini.
        $mahasiswaValidated = $request->validate([
            'mahasiswa.nama' => ['sometimes', 'string', 'max:255'],
            'mahasiswa.nik' => ['sometimes', 'nullable', 'string', 'regex:/^\d{16}$/'],
            'mahasiswa.mother_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'mahasiswa.birth_place' => ['sometimes', 'nullable', 'string', 'max:255'],
            'mahasiswa.birth_date' => ['sometimes', 'nullable', 'date'],
            'mahasiswa.gender' => ['sometimes', 'nullable', Rule::in(['L', 'P'])],
            'mahasiswa.shirt_size' => ['sometimes', 'nullable', 'string', 'max:10'],
            'mahasiswa.marital_status' => ['sometimes', 'nullable', 'string', 'max:20'],
            'mahasiswa.phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'mahasiswa.alamat' => ['sometimes', 'nullable', 'string'],
            'mahasiswa.api_email' => ['sometimes', 'nullable', 'email'],
            'mahasiswa.fakultas_id' => ['sometimes', 'nullable', 'exists:fakultas,id'],
            'mahasiswa.prodi_id' => ['sometimes', 'nullable', 'exists:prodi,id'],
            'mahasiswa.batch_year' => ['sometimes', 'nullable', 'integer', 'min:2000', 'max:'.((int) date('Y') + 1)],
            'mahasiswa.semester' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:20'],
            'mahasiswa.sks_completed' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:250'],
            'mahasiswa.gpa' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:4'],
            'mahasiswa.is_paid_ukt' => ['sometimes', 'boolean'],
            'mahasiswa.status_bta_ppi' => ['sometimes', 'nullable', 'string', 'max:50'],
            'mahasiswa.status_aktif' => ['sometimes', 'nullable', 'string', 'max:50'],
        ]);

        // Dosen fields — NIP di-LOCK, tidak boleh diubah lewat endpoint ini.
        $dosenValidated = $request->validate([
            'dosen.nama' => ['sometimes', 'string', 'max:255'],
            'dosen.nama_gelar' => ['sometimes', 'nullable', 'string', 'max:255'],
            'dosen.nidn' => ['sometimes', 'nullable', 'string', 'max:20'],
            'dosen.nik' => ['sometimes', 'nullable', 'string', 'regex:/^\d{16}$/'],
            'dosen.phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'dosen.jabatan' => ['sometimes', 'nullable', 'string', 'max:100'],
            'dosen.pangkat' => ['sometimes', 'nullable', 'string', 'max:100'],
            'dosen.golongan' => ['sometimes', 'nullable', 'string', 'max:20'],
            'dosen.pendidikan_terakhir' => ['sometimes', 'nullable', 'string', 'max:100'],
            'dosen.birth_date' => ['sometimes', 'nullable', 'date'],
            'dosen.tempat_lahir' => ['sometimes', 'nullable', 'string', 'max:255'],
            'dosen.gender' => ['sometimes', 'nullable', Rule::in(['L', 'P'])],
            'dosen.alamat' => ['sometimes', 'nullable', 'string'],
            'dosen.status_aktif' => ['sometimes', 'nullable', 'string', 'max:50'],
            'dosen.status_pegawai' => ['sometimes', 'nullable', 'string', 'max:50'],
            'dosen.is_cpns' => ['sometimes', 'boolean'],
            'dosen.is_tugas_belajar' => ['sometimes', 'boolean'],
            'dosen.fakultas_id' => ['sometimes', 'nullable', 'exists:fakultas,id'],
        ]);

        // Audit fix (2026-05-12): superadmin bisa edit SEMUA field user + relasi
        // (mahasiswa/dosen) KECUALI NIM/NIP yang di-LOCK karena dipakai sebagai
        // upsert key di sync SIAKAD dan updateOrCreate di banyak path.
        $userFieldsChanged = [];
        $mahasiswaFieldsChanged = [];
        $dosenFieldsChanged = [];
        $oldValues = [];
        $newValues = [];

        DB::transaction(function () use (
            $user,
            $validated,
            $mahasiswaValidated,
            $dosenValidated,
            &$userFieldsChanged,
            &$mahasiswaFieldsChanged,
            &$dosenFieldsChanged,
            &$oldValues,
            &$newValues,
        ) {
            // User-level updates.
            foreach (['username', 'name', 'email', 'is_active', 'fakultas_id'] as $field) {
                if (array_key_exists($field, $validated)) {
                    $oldValues["user.{$field}"] = $user->{$field};
                    $user->{$field} = $validated[$field];
                    $newValues["user.{$field}"] = $validated[$field];
                    $userFieldsChanged[] = $field;
                }
            }
            if ($userFieldsChanged !== []) {
                $user->save();
                $user->lockFields($userFieldsChanged);
            }

            // Mahasiswa-level updates (kalau user punya mahasiswa record).
            if (! empty($mahasiswaValidated['mahasiswa'])) {
                $mahasiswa = Mahasiswa::where('user_id', $user->id)->first();
                if ($mahasiswa !== null) {
                    $updates = $mahasiswaValidated['mahasiswa'];
                    foreach ($updates as $field => $value) {
                        $oldValues["mahasiswa.{$field}"] = $mahasiswa->{$field};
                        $mahasiswa->{$field} = $value;
                        $newValues["mahasiswa.{$field}"] = $value;
                        $mahasiswaFieldsChanged[] = $field;
                    }
                    if ($mahasiswaFieldsChanged !== []) {
                        $mahasiswa->save();
                        $mahasiswa->lockFields($mahasiswaFieldsChanged);
                    }
                }
            }

            // Dosen-level updates.
            if (! empty($dosenValidated['dosen'])) {
                $dosen = Dosen::where('user_id', $user->id)->first();
                if ($dosen !== null) {
                    $updates = $dosenValidated['dosen'];
                    foreach ($updates as $field => $value) {
                        $oldValues["dosen.{$field}"] = $dosen->{$field};
                        $dosen->{$field} = $value;
                        $newValues["dosen.{$field}"] = $value;
                        $dosenFieldsChanged[] = $field;
                    }
                    if ($dosenFieldsChanged !== []) {
                        $dosen->save();
                        $dosen->lockFields($dosenFieldsChanged);
                    }
                }
            }
        });

        // Audit log eksplisit supaya investigator bisa trace sumber perubahan
        // tanpa bergantung ke AuditObserver (yang mask PII values).
        if ($userFieldsChanged !== [] || $mahasiswaFieldsChanged !== [] || $dosenFieldsChanged !== []) {
            AuditService::log(
                'SUPERADMIN_EDIT_USER',
                sprintf(
                    'Superadmin edit user id=%d (%s): %d field user, %d field mahasiswa, %d field dosen',
                    $user->id,
                    $user->username,
                    count($userFieldsChanged),
                    count($mahasiswaFieldsChanged),
                    count($dosenFieldsChanged),
                ),
                $user,
                $oldValues,
                $newValues,
            );
        }

        return $this->success(
            new UserResource($user->refresh()->load(['roles', 'fakultas'])),
            'Data pengguna berhasil diperbarui.'
        );
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
