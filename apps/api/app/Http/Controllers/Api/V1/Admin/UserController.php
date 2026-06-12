<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DosenResource;
use App\Http\Resources\Api\V1\MahasiswaResource;
use App\Http\Resources\Api\V1\UserResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Dosen;
use App\Models\KKN\ExternalStudentProfile;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use App\Services\AuditService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        if (! auth()->user()?->hasRole('superadmin')) {
            return $this->forbidden('Hanya superadmin yang dapat mengelola pengguna.');
        }

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'role' => ['nullable', 'string', Rule::in(['superadmin', 'admin', 'faculty_admin', 'external_lppm_admin', 'dosen', 'dpl', 'student'])],
            'is_active' => ['nullable', 'boolean'],
            'fakultas_id' => ['nullable', 'integer', 'exists:fakultas,id'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        $query = User::with(['fakultas', 'externalUniversity', 'roles', 'mahasiswa.fakultas', 'dosen.fakultas'])
            ->when($validated['search'] ?? null, function ($q, string $s) {
                $escaped = str_replace(['%', '_'], ['\%', '\_'], trim($s));
                $q->where(function ($qq) use ($escaped) {
                    $qq->where('name', 'like', "%{$escaped}%")
                        ->orWhere('username', 'like', "%{$escaped}%")
                        ->orWhere('email', 'like', "%{$escaped}%");
                });
            })
            ->when($validated['role'] ?? null, fn ($q, string $r) => $q->role($r))
            ->when(array_key_exists('is_active', $validated), fn ($q) => $q->where('is_active', (bool) $validated['is_active']))
            ->when($validated['fakultas_id'] ?? null, function ($q, int $id) {
                $q->where(function ($qq) use ($id) {
                    $qq->where('fakultas_id', $id)
                        ->orWhereHas('mahasiswa', fn ($m) => $m->where('fakultas_id', $id))
                        ->orWhereHas('dosen', fn ($d) => $d->where('fakultas_id', $id));
                });
            })
            ->orderByRaw("CASE WHEN EXISTS (
                SELECT 1
                FROM peserta_kkn pk
                INNER JOIN mahasiswa m ON m.id = pk.mahasiswa_id
                WHERE m.user_id = users.id
                  AND pk.deleted_at IS NULL
                  AND pk.status IN ('submitted', 'approved', 'document_submitted', 'document_verified')
            ) THEN 0 ELSE 1 END")
            ->orderByRaw("CASE WHEN avatar IS NOT NULL AND avatar <> '' THEN 0 ELSE 1 END")
            ->orderByDesc('created_at');

        return $this->successCollection(UserResource::collection($query->paginate($validated['per_page'] ?? 25)));
    }

    public function onlineUsers(Request $request): JsonResponse
    {
        if (! auth()->user()?->hasRole('superadmin')) {
            return $this->forbidden('Hanya superadmin yang dapat melihat pengguna online.');
        }

        $validated = $request->validate([
            'minutes' => ['nullable', 'integer', 'min:1', 'max:60'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $minutes = (int) ($validated['minutes'] ?? 5);
        $limit = (int) ($validated['limit'] ?? 30);
        $threshold = now()->subMinutes($minutes);

        $rows = DB::table('personal_access_tokens')
            ->join('users', 'users.id', '=', 'personal_access_tokens.tokenable_id')
            ->leftJoin('model_has_roles', function ($join) {
                $join->on('model_has_roles.model_id', '=', 'users.id')
                    ->where('model_has_roles.model_type', '=', User::class);
            })
            ->leftJoin('roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->where('personal_access_tokens.tokenable_type', User::class)
            ->whereNotNull('personal_access_tokens.last_used_at')
            ->where('personal_access_tokens.last_used_at', '>=', $threshold)
            ->select([
                'users.id',
                'users.username',
                'users.name',
                'users.email',
                'users.avatar',
                DB::raw('MAX(personal_access_tokens.last_used_at) as last_activity'),
                DB::raw('COUNT(DISTINCT personal_access_tokens.id) as session_count'),
                DB::raw("STRING_AGG(DISTINCT roles.name, ',') as roles"),
            ])
            ->groupBy('users.id', 'users.username', 'users.name', 'users.email', 'users.avatar')
            ->orderByDesc('last_activity')
            ->limit($limit)
            ->get()
            ->map(function ($row) {
                $lastSeen = Carbon::parse($row->last_activity);

                return [
                    'id' => (int) $row->id,
                    'username' => $row->username,
                    'name' => $row->name,
                    'email' => $row->email,
                    'avatar_url' => $row->avatar ? asset('storage/'.$row->avatar) : null,
                    'roles' => $row->roles ? explode(',', $row->roles) : [],
                    'session_count' => (int) $row->session_count,
                    'ip_address' => null,
                    'user_agent' => null,
                    'last_seen_at' => $lastSeen->toIso8601String(),
                    'last_seen_human' => $lastSeen->diffForHumans(),
                    'is_online' => true,
                ];
            });

        return $this->success([
            'users' => $rows,
            'total' => $rows->count(),
            'window_minutes' => $minutes,
            'checked_at' => now()->toIso8601String(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (! auth()->user()?->hasRole('superadmin')) {
            return $this->forbidden('Hanya superadmin yang dapat menambahkan pengguna.');
        }

        $validated = $request->validate([
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'unique:users,email'],
            'password' => ['required', 'string', ...User::PASSWORD_REQUIREMENTS],
            'account_type' => ['nullable', 'string', Rule::in(['admin_internal', 'admin_external', 'faculty_admin', 'dosen', 'dpl', 'student_internal', 'student_external'])],
            'role' => ['required', 'string', Rule::in(['admin', 'faculty_admin', 'external_lppm_admin', 'dosen', 'dpl', 'student'])],
            'fakultas_id' => ['nullable', 'required_if:role,faculty_admin', 'required_if:account_type,student_internal', 'required_if:account_type,dosen', 'required_if:account_type,dpl', 'exists:fakultas,id'],
            'external_university_id' => ['nullable', 'required_if:role,external_lppm_admin', 'exists:external_universities,id'],
            'mahasiswa' => ['required_if:role,student', 'array'],
            'mahasiswa.nim' => ['required_if:account_type,student_internal', 'string', 'max:20', 'unique:mahasiswa,nim'],
            'mahasiswa.external_nim' => ['required_if:account_type,student_external', 'string', 'max:50', 'unique:mahasiswa,nim'],
            'mahasiswa.external_batch_id' => ['required_if:account_type,student_external', 'integer', 'exists:external_kkn_batches,id'],
            'mahasiswa.external_faculty' => ['required_if:account_type,student_external', 'string', 'max:255'],
            'mahasiswa.external_study_program' => ['required_if:account_type,student_external', 'string', 'max:255'],
            'mahasiswa.prodi_id' => [
                'required_if:account_type,student_internal',
                'integer',
                Rule::exists('prodi', 'id')->where(fn ($query) => $query->where('fakultas_id', $request->input('fakultas_id') ?: 0)),
            ],
            'mahasiswa.batch_year' => ['required_if:role,student', 'integer', 'min:2000', 'max:'.((int) date('Y') + 1)],
            'mahasiswa.semester' => ['nullable', 'integer', 'min:1', 'max:20'],
            'mahasiswa.gender' => ['nullable', Rule::in(['L', 'P'])],
            'mahasiswa.phone' => ['nullable', 'string', 'max:30'],
            'mahasiswa.status_aktif' => ['nullable', 'string', 'max:50'],
            'dosen' => ['required_if:role,dosen', 'required_if:role,dpl', 'array'],
            'dosen.nip' => ['required_if:role,dosen', 'required_if:role,dpl', 'string', 'max:50', 'unique:dosen,nip'],
            'dosen.gender' => ['nullable', Rule::in(['L', 'P'])],
            'dosen.phone' => ['nullable', 'string', 'max:30'],
            'dosen.status_aktif' => ['nullable', 'string', 'max:50'],
        ]);

        $accountType = $validated['account_type'] ?? match ($validated['role']) {
            'admin' => 'admin_internal',
            'external_lppm_admin' => 'admin_external',
            'faculty_admin' => 'faculty_admin',
            'dosen' => 'dosen',
            'dpl' => 'dpl',
            default => 'student_internal',
        };

        $expectedRole = match ($accountType) {
            'admin_internal' => 'admin',
            'admin_external' => 'external_lppm_admin',
            'faculty_admin' => 'faculty_admin',
            'dosen' => 'dosen',
            'dpl' => 'dpl',
            'student_internal', 'student_external' => 'student',
        };

        if ($validated['role'] !== $expectedRole) {
            return $this->error('ROLE_ACCOUNT_TYPE_MISMATCH', 'Tipe akun tidak sesuai dengan role yang dipilih.', 422);
        }

        if ($accountType === 'student_external') {
            validator($request->all(), [
                'external_university_id' => ['required', 'exists:external_universities,id'],
            ])->validate();
        }

        $externalUniversityId = $validated['external_university_id'] ?? null;
        if (in_array($accountType, ['admin_external', 'student_external'], true)) {
            $externalUniversityId = validator(
                ['external_university_id' => $request->input('external_university_id')],
                ['external_university_id' => ['required', 'exists:external_universities,id']]
            )->validate()['external_university_id'];
        }

        if ($accountType === 'student_external') {
            $batch = DB::table('external_kkn_batches')->where('id', $validated['mahasiswa']['external_batch_id'])->first();
            $universityName = (string) DB::table('external_universities')->where('id', $externalUniversityId)->value('name');
            if (! $batch || trim((string) $batch->home_university) !== trim($universityName)) {
                return $this->error('EXTERNAL_BATCH_UNIVERSITY_MISMATCH', 'Batch eksternal tidak sesuai dengan kampus eksternal yang dipilih.', 422);
            }
        }

        $user = DB::transaction(function () use ($validated, $externalUniversityId, $accountType) {
            $user = User::create([
                'username' => $validated['username'],
                'name' => $validated['name'],
                'email' => $validated['email'] ?? null,
                'password' => Hash::make($validated['password']),
                'must_change_password' => true,
                'is_active' => true,
                'fakultas_id' => $validated['fakultas_id'] ?? null,
                'external_university_id' => $externalUniversityId,
            ]);
            $user->assignRole($validated['role']);
            if ($accountType === 'dpl' && ! $user->hasRole('dosen')) {
                $user->assignRole('dosen');
            }

            if ($validated['role'] === 'student') {
                $mahasiswa = $validated['mahasiswa'];
                $isExternal = $accountType === 'student_external';
                $nim = $isExternal ? $mahasiswa['external_nim'] : $mahasiswa['nim'];
                $student = Mahasiswa::create([
                    'user_id' => $user->id,
                    'nim' => $nim,
                    'nama' => $validated['name'],
                    'origin_type' => $isExternal ? 'external' : 'internal',
                    'external_university_id' => $isExternal ? $externalUniversityId : null,
                    'external_nim' => $isExternal ? $mahasiswa['external_nim'] : null,
                    'external_faculty_name' => $isExternal ? $mahasiswa['external_faculty'] : null,
                    'external_prodi_name' => $isExternal ? $mahasiswa['external_study_program'] : null,
                    'fakultas_id' => $isExternal ? null : $validated['fakultas_id'],
                    'prodi_id' => $isExternal ? null : $mahasiswa['prodi_id'],
                    'batch_year' => $mahasiswa['batch_year'],
                    'semester' => $mahasiswa['semester'] ?? null,
                    'gender' => $mahasiswa['gender'] ?? null,
                    'phone' => $mahasiswa['phone'] ?? null,
                    'status_aktif' => $mahasiswa['status_aktif'] ?? 'Aktif',
                    'api_email' => $validated['email'] ?? null,
                ]);

                if ($isExternal) {
                    ExternalStudentProfile::create([
                        'mahasiswa_id' => $student->id,
                        'batch_id' => $mahasiswa['external_batch_id'],
                        'external_nim' => $mahasiswa['external_nim'],
                        'home_university' => (string) DB::table('external_universities')->where('id', $externalUniversityId)->value('name'),
                        'external_faculty' => $mahasiswa['external_faculty'],
                        'external_study_program' => $mahasiswa['external_study_program'],
                    ]);
                }
            }

            if (in_array($accountType, ['dosen', 'dpl'], true)) {
                $dosen = $validated['dosen'];
                Dosen::create([
                    'user_id' => $user->id,
                    'nip' => $dosen['nip'],
                    'nama' => $validated['name'],
                    'fakultas_id' => $validated['fakultas_id'],
                    'gender' => $dosen['gender'] ?? null,
                    'phone' => $dosen['phone'] ?? null,
                    'status_aktif' => $dosen['status_aktif'] ?? 'Aktif',
                ]);
            }

            return $user;
        });

        return $this->created(new UserResource($user->load(['roles', 'externalUniversity', 'mahasiswa'])), 'Pengguna berhasil ditambahkan.');
    }

    public function toggleActive(User $user): JsonResponse
    {
        if ($user->id === auth()->id()) {
            return $this->error('FORBIDDEN', 'Anda tidak dapat menonaktifkan akun sendiri.', 403);
        }

        $user->update(['is_active' => ! $user->is_active]);

        return $this->success(new UserResource($user->refresh()->load('roles')), 'Status pengguna berhasil diperbarui.');
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
            'external_university_id' => ['sometimes', 'nullable', 'exists:external_universities,id'],
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
            foreach (['username', 'name', 'email', 'is_active', 'fakultas_id', 'external_university_id'] as $field) {
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

                        if ($field === 'api_email') {
                            $oldValues['user.email'] = $user->email;
                            $user->email = $value;
                            $newValues['user.email'] = $value;
                            $userFieldsChanged[] = 'email';
                        }
                    }
                    if ($mahasiswaFieldsChanged !== []) {
                        $mahasiswa->save();
                        $mahasiswa->lockFields($mahasiswaFieldsChanged);
                    }

                    if (in_array('email', $userFieldsChanged, true) && $user->isDirty('email')) {
                        $user->save();
                        $user->lockFields(['email']);
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
            new UserResource($user->refresh()->load(['roles', 'fakultas', 'externalUniversity'])),
            'Data pengguna berhasil diperbarui.'
        );
    }

    public function resetTemporaryPassword(User $user): JsonResponse
    {
        if (! auth()->user()?->hasRole('superadmin')) {
            return $this->forbidden('Hanya superadmin yang dapat mereset password pengguna.');
        }

        if (filled($user->email)) {
            $token = Password::broker()->createToken($user);
            $user->sendPasswordResetNotification($token);

            AuditService::log(
                'SUPERADMIN_SEND_RESET_LINK',
                sprintf('Superadmin mengirim tautan reset password untuk user id=%d (%s)', $user->id, $user->username),
                $user,
                [],
                ['delivery' => 'email']
            );

            return $this->success(
                ['username' => $user->username, 'delivery' => 'email', 'email_sent' => true],
                'Tautan reset password berhasil dikirim ke email pengguna.'
            );
        }

        $birthDate = Mahasiswa::where('user_id', $user->id)->value('birth_date')
            ?? Dosen::where('user_id', $user->id)->value('birth_date');

        if (! $birthDate) {
            return $this->error('VALIDATION_ERROR', 'Email pengguna belum tersedia untuk pengiriman tautan reset password.', 422);
        }

        $defaultPassword = Carbon::parse($birthDate)->format('dmY');
        $user->update(['password' => Hash::make($defaultPassword), 'must_change_password' => true]);

        AuditService::log(
            'SUPERADMIN_RESET_PASSWORD',
            sprintf('Superadmin reset password default DDMMYYYY untuk user id=%d (%s)', $user->id, $user->username),
            $user,
            [],
            ['delivery' => 'default_ddmmyyyy']
        );

        return $this->success(
            ['username' => $user->username, 'delivery' => 'default_ddmmyyyy'],
            'Password berhasil direset ke default DDMMYYYY. User wajib mengganti password saat login.'
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
                $q->where(function ($qq) use ($escaped, $s) {
                    $qq->where('nama', 'like', "%{$escaped}%");
                    if (preg_match('/^\d{6,20}$/', trim($s))) {
                        $qq->orWhere('nim_bidx', Mahasiswa::computeBlindIndex(trim($s)));
                    }
                });
            })
            ->when($request->input('fakultas_id'), fn ($q, $id) => $q->where('fakultas_id', $id))
            ->when($request->input('prodi_id'), fn ($q, $id) => $q->where('prodi_id', $id))
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
