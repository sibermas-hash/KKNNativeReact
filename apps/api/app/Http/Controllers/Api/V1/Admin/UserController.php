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
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    use ApiResponse;

    private const AUDIT_MASK = '***MASKED***';

    private const AUDIT_SENSITIVE_FIELDS = [
        'password',
        'password_confirmation',
        'current_password',
        'remember_token',
        'api_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'nik',
        'nip',
        'nim',
        'nidn',
        'npwp',
        'phone',
        'no_hp',
        'telepon',
        'birth_date',
        'tanggal_lahir',
        'mother_name',
        'nama_ibu',
        'email',
        'api_email',
        'alamat',
        'address',
        'birth_place',
        'tempat_lahir',
        'no_rekening',
        'nama_bank',
    ];

    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min((int) $request->input('per_page', 25), 100));
        $activeFilter = $request->query('is_active');

        $query = User::with(['fakultas', 'roles', 'mahasiswa.prodi', 'mahasiswa.fakultas'])
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = trim((string) $request->input('search'));

                $q->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->input('role'), fn ($q, $r) => $q->role($r))
            ->when($request->filled('fakultas_id'), fn ($q, $fakultasId) => $q->where('fakultas_id', (int) $fakultasId))
            ->when($activeFilter !== null && $activeFilter !== '', function ($q) use ($activeFilter) {
                $isActive = filter_var($activeFilter, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

                if ($isActive !== null) {
                    $q->where('is_active', $isActive);
                }
            })
            ->orderByDesc('created_at');

        return $this->successCollection(UserResource::collection($query->paginate($perPage)->withQueryString()));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'unique:users,email'],
            'password' => ['required', 'string', ...User::PASSWORD_REQUIREMENTS],
            'role' => ['required', 'string', Rule::in(['superadmin', 'admin', 'faculty_admin', 'dosen', 'dpl', 'student'])],
            'fakultas_id' => ['nullable', 'exists:fakultas,id'],
        ]);
        $user = DB::transaction(function () use ($validated) {
            $existingMahasiswa = null;
            if (($validated['role'] ?? null) === 'student') {
                $existingMahasiswa = Mahasiswa::where('nim', $validated['username'])->first();
                if ($existingMahasiswa && $existingMahasiswa->user_id) {
                    abort(response()->json([
                        'success' => false,
                        'message' => 'NIM sudah terhubung dengan akun pengguna lain.',
                        'errors' => ['username' => ['NIM sudah terhubung dengan akun pengguna lain.']],
                    ], 422));
                }
            }

            $user = User::create([
                'username' => $validated['username'],
                'name' => $validated['name'],
                'email' => $validated['email'] ?? null,
                'password' => $validated['password'],
                'must_change_password' => true,
                'is_active' => true,
                'fakultas_id' => $validated['fakultas_id'] ?? null,
            ]);
            $user->assignRole($validated['role']);

            if (($validated['role'] ?? null) === 'student') {
                if ($existingMahasiswa) {
                    $existingMahasiswa->update([
                        'user_id' => $user->id,
                        'nama' => $validated['name'],
                        'fakultas_id' => $validated['fakultas_id'] ?? $existingMahasiswa->fakultas_id,

                    ]);
                }
            }

            return $user;
        });

        AuditService::log(
            'SUPERADMIN_CREATE_USER',
            sprintf(
                'Superadmin membuat user id=%d (%s) dengan role %s',
                $user->id,
                $user->username,
                $validated['role']
            ),
            $user,
            null,
            $this->sanitizeAuditPayload([
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'name' => $user->name,
                    'email' => $user->email,
                    'fakultas_id' => $user->fakultas_id,
                    'is_active' => $user->is_active,
                    'must_change_password' => $user->must_change_password,
                ],
                'role' => $validated['role'],
            ])
        );

        return $this->created(new UserResource($user->load('roles')), 'Pengguna berhasil ditambahkan.');
    }

    public function toggleActive(User $user): JsonResponse
    {
        if ($user->id === auth()->id() && $user->is_active) {
            return $this->forbidden('Anda tidak dapat menonaktifkan akun Anda sendiri.');
        }

        if ($this->wouldRemoveLastActiveSuperadmin($user, false)) {
            return $this->forbidden('Tidak dapat menonaktifkan superadmin aktif terakhir.');
        }

        $before = ['is_active' => (bool) $user->is_active];
        $user->update(['is_active' => ! $user->is_active]);

        AuditService::log(
            'SUPERADMIN_TOGGLE_USER_STATUS',
            sprintf(
                'Superadmin mengubah status user id=%d (%s) menjadi %s',
                $user->id,
                $user->username,
                $user->is_active ? 'aktif' : 'nonaktif'
            ),
            $user,
            $before,
            ['is_active' => (bool) $user->is_active]
        );

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

        if ($request->has('is_active')) {
            $nextActive = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

            if ($nextActive === false && $user->id === auth()->id() && $user->is_active) {
                return $this->forbidden('Anda tidak dapat menonaktifkan akun Anda sendiri.');
            }

            if ($nextActive === false && $this->wouldRemoveLastActiveSuperadmin($user, false)) {
                return $this->forbidden('Tidak dapat menonaktifkan superadmin aktif terakhir.');
            }
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

        // Backward compatibility: older admin UI still sends `mahasiswa.api_email`,
        // but the canonical storage has moved to `users.email`. Accept it as an
        // alias and never attempt to persist a non-existent mahasiswa column.
        if (
            isset($mahasiswaValidated['mahasiswa'])
            && is_array($mahasiswaValidated['mahasiswa'])
            && array_key_exists('api_email', $mahasiswaValidated['mahasiswa'])
        ) {
            if (! array_key_exists('email', $validated)) {
                $validated['email'] = $mahasiswaValidated['mahasiswa']['api_email'];
            }

            unset($mahasiswaValidated['mahasiswa']['api_email']);
        }

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
                $this->sanitizeAuditPayload($oldValues),
                $this->sanitizeAuditPayload($newValues),
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

        $user->loadMissing(['mahasiswa', 'dosen']);
        $birthDate = $user->mahasiswa?->birth_date ?? $user->dosen?->birth_date ?? null;

        if (! $birthDate) {
            return $this->validationError(
                ['birth_date' => ['Tanggal lahir pengguna belum tersedia. Isi tanggal lahir terlebih dahulu.']],
                'Tanggal lahir pengguna belum tersedia untuk membuat password default DDMMYYYY.'
            );
        }

        try {
            $defaultPassword = \Carbon\Carbon::parse($birthDate)->format('dmY');
        } catch (\Throwable $e) {
            report($e);

            return $this->validationError(
                ['birth_date' => ['Format tanggal lahir pengguna tidak valid.']],
                'Format tanggal lahir pengguna tidak valid.'
            );
        }

        $user->forceFill([
            'password' => $defaultPassword,
            'must_change_password' => true,
            'password_changed_at' => null,
        ])->save();

        AuditService::log(
            'SUPERADMIN_RESET_PASSWORD_TO_DEFAULT',
            sprintf(
                'Superadmin mereset password user id=%d (%s) ke default DDMMYYYY',
                $user->id,
                $user->username
            ),
            $user,
            null,
            $this->sanitizeAuditPayload([
                'delivery' => 'default_ddmmyyyy',
                'password_value' => self::AUDIT_MASK,
                'must_change_password' => true,
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                ],
            ])
        );

        return $this->success(
            ['username' => $user->username, 'delivery' => 'default_ddmmyyyy', 'must_change_password' => true],
            'Password pengguna berhasil direset ke default DDMMYYYY. Pengguna wajib mengganti password setelah login.'
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

        if ($validated['role'] !== 'superadmin' && $this->wouldRemoveLastActiveSuperadmin($user, null, $validated['role'])) {
            return $this->forbidden('Tidak dapat menurunkan role superadmin aktif terakhir.');
        }

        $oldRoles = $user->getRoleNames()->values()->all();
        $user->syncRoles([$validated['role']]);

        AuditService::log(
            'SUPERADMIN_UPDATE_USER_ROLE',
            sprintf(
                'Superadmin mengubah role user id=%d (%s) dari [%s] menjadi [%s]',
                $user->id,
                $user->username,
                implode(', ', $oldRoles),
                $validated['role']
            ),
            $user,
            ['roles' => $oldRoles],
            ['roles' => [$validated['role']]],
        );

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
            ->when($request->input('sort_by'), function ($q) use ($request) {
                $allowed = ['nim', 'nama', 'batch_year', 'semester', 'gpa', 'status_aktif'];
                $field = $request->input('sort_by');
                $dir = $request->input('sort_dir', 'asc') === 'desc' ? 'desc' : 'asc';
                if (in_array($field, $allowed)) {
                    $q->orderBy($field, $dir);
                }
            }, function ($q) {
                $q->orderByDesc('created_at');
            });

        return $this->successCollection(MahasiswaResource::collection($query->paginate(25)));
    }

    public function mahasiswaShow(string|int $mahasiswa): JsonResponse
    {
        $record = Mahasiswa::query()
            ->whereKey($mahasiswa)
            ->orWhere('user_id', $mahasiswa)
            ->first();

        if (! $record) {
            return $this->notFound('Mahasiswa tidak ditemukan.');
        }

        $record->load(['user', 'fakultas', 'prodi', 'peserta.kelompok']);

        return $this->success(new MahasiswaResource($record));
    }

    public function dosenIndex(Request $request): JsonResponse
    {
        $query = Dosen::with(['user', 'fakultas'])
            ->when($request->input('search'), function ($q, $s) {
                $term = trim((string) $s);
                $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $term);
                $q->where(function ($w) use ($term, $escaped) {
                    $w->where('nama', 'ilike', "%{$escaped}%")
                        ->orWhere('nip', 'ilike', "%{$escaped}%");
                    if (preg_match('/^\d{6,20}$/', $term)) {
                        $w->orWhere('nip_bidx', Dosen::computeBlindIndex($term));
                    }
                });
            })
            ->when($request->input('fakultas_id'), fn ($q, $id) => $q->where('fakultas_id', $id))
            ->orderBy('nama');

        return $this->successCollection(DosenResource::collection($query->paginate($request->integer('per_page', 25))));
    }

    public function transfer(Request $request): JsonResponse
    {
        $request->validate(['peserta_kkn_id' => ['required', 'exists:peserta_kkn,id'], 'target_kelompok_id' => ['required', 'exists:kelompok_kkn,id']]);
        $peserta = PesertaKkn::findOrFail($request->input('peserta_kkn_id'));
        $peserta->update(['kelompok_id' => $request->input('target_kelompok_id'), 'joined_group_at' => now()]);

        return $this->success(['id' => $peserta->id], 'Mahasiswa berhasil dipindahkan.');
    }

    private function wouldRemoveLastActiveSuperadmin(User $user, ?bool $nextActive = null, ?string $nextRole = null): bool
    {
        if (! $user->hasRole('superadmin') || ! $user->is_active) {
            return false;
        }

        $willStaySuperadmin = ($nextRole ?? 'superadmin') === 'superadmin';
        $willStayActive = $nextActive ?? true;

        if ($willStaySuperadmin && $willStayActive) {
            return false;
        }

        return User::role('superadmin')->where('is_active', true)->count() <= 1;
    }

    /**
     * @return array<string, mixed>
     */
    private function sanitizeAuditPayload(array $payload): array
    {
        $sanitized = [];

        foreach ($payload as $key => $value) {
            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizeAuditPayload($value);

                continue;
            }

            if (in_array((string) $key, self::AUDIT_SENSITIVE_FIELDS, true)) {
                $sanitized[$key] = self::AUDIT_MASK;

                continue;
            }

            $sanitized[$key] = $value;
        }

        return $sanitized;
    }
}
