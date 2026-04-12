<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Prodi;
use App\Models\User;
use App\Notifications\KKN\AccountActivatedNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    use \App\Traits\HandlesPagination;

    public function index(Request $request): Response
    {
        $users = User::with(['roles', 'mahasiswa.prodi.fakultas', 'dosen.fakultas', 'fakultas'])
            ->when($request->input('search'), function ($q, $search) {
                $s = str_replace(['%', '_'], ['\\%', '\\_'], $search);
                $q->where(function ($query) use ($s) {
                    $query->where('name', 'like', "%{$s}%")
                        ->orWhere('email', 'like', "%{$s}%")
                        ->orWhere('username', 'like', "%{$s}%")
                        ->orWhereHas('fakultas', fn ($facultyQuery) => $facultyQuery->where('nama', 'like', "%{$s}%"));
                });
            })
            ->when($request->input('role'), fn ($q, $role) => $q->role($role))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'is_active' => (bool) $user->is_active,
                'email_verified_at' => $user->email_verified_at ? $user->email_verified_at->toIso8601String() : null,
                'roles' => $user->roles->pluck('name')->toArray(),
            ]);

        return Inertia::render('Admin/System/Users/Index', [
            'users' => $this->formatPaginator($users),
            'filters' => $request->only('search', 'role'),
            'title' => 'Manajemen Semua Pengguna',
        ]);
    }

    public function dosenIndex(Request $request): Response
    {
        $users = User::role('dpl')
            ->with(['dosen.fakultas'])
            ->when($request->input('search'), function ($q, $search) {
                $s = str_replace(['%', '_'], ['\\%', '\\_'], $search);
                $q->where(function ($query) use ($s) {
                    $query->where('name', 'like', "%{$s}%")
                        ->orWhere('email', 'like', "%{$s}%")
                        ->orWhereHas('dosen', fn ($sq) => $sq->where('nip', 'like', "%{$s}%"));
                });
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'is_active' => (bool) $user->is_active,
                'email_verified_at' => $user->email_verified_at ? $user->email_verified_at->toIso8601String() : null,
                'roles' => $user->roles->pluck('name')->toArray(),
            ]);

        return Inertia::render('Admin/System/Users/DosenIndex', [
            'users' => $this->formatPaginator($users),
            'filters' => $request->only('search'),
            'title' => 'Manajemen Data Dosen (DPL)',
        ]);
    }

    public function mahasiswaIndex(Request $request): Response
    {
        $filters = $request->only([
            'search',
            'faculty_id',
            'program_id',
            'batch_year',
            'gender',
            'bta_ppi',
            'account_status',
            'sync_status',
        ]);

        $studentsQuery = Mahasiswa::query()
            ->with(['user:id,username,name,email,is_active,address', 'prodi.fakultas', 'fakultas'])
            ->when($request->input('search'), function ($query, $search) {
                $s = str_replace(['%', '_'], ['\\%', '\\_'], $search);
                $query->where(function ($inner) use ($s) {
                    $inner->where('nama', 'like', "%{$s}%")
                        ->orWhere('nim', 'like', "%{$s}%")
                        ->orWhere('nik', 'like', "%{$s}%")
                        ->orWhere('mother_name', 'like', "%{$s}%")
                        ->orWhereHas('user', function ($userQuery) use ($s) {
                            $userQuery->where('username', 'like', "%{$s}%")
                                ->orWhere('email', 'like', "%{$s}%")
                                ->orWhere('name', 'like', "%{$s}%");
                        })
                        ->orWhereHas('user', function ($userQuery) use ($s) {
                            $userQuery->where('address', 'like', "%{$s}%");
                        })
                        ->orWhereHas('prodi', fn ($programQuery) => $programQuery->where('nama', 'like', "%{$s}%"))
                        ->orWhereHas('fakultas', fn ($facultyQuery) => $facultyQuery->where('nama', 'like', "%{$s}%"))
                        ->orWhereHas('prodi.fakultas', fn ($facultyQuery) => $facultyQuery->where('nama', 'like', "%{$s}%"));
                });
            })
            ->when($request->filled('faculty_id'), function ($query) use ($request) {
                $facultyId = (int) $request->input('faculty_id');

                $query->where(function ($inner) use ($facultyId) {
                    $inner->where('faculty_id', $facultyId)
                        ->orWhereHas('prodi', fn ($programQuery) => $programQuery->where('faculty_id', $facultyId));
                });
            })
            ->when($request->filled('program_id'), fn ($query) => $query->where('program_id', (int) $request->input('program_id')))
            ->when($request->filled('batch_year'), fn ($query) => $query->where('batch_year', (int) $request->input('batch_year')))
            ->when($request->filled('gender'), fn ($query) => $query->where('gender', $request->string('gender')->toString()))
            ->when($request->filled('bta_ppi'), function ($query) use ($request) {
                $query->where('is_bta_ppi_passed', $request->string('bta_ppi')->toString() === 'passed');
            })
            ->when($request->filled('account_status'), function ($query) use ($request) {
                match ($request->string('account_status')->toString()) {
                    'active' => $query->whereHas('user', fn ($userQuery) => $userQuery->where('is_active', true)),
                    'locked' => $query->whereHas('user', fn ($userQuery) => $userQuery->where('is_active', false)),
                    'no_account' => $query->whereDoesntHave('user'),
                    default => null,
                };
            })
            ->when($request->filled('sync_status'), function ($query) use ($request) {
                match ($request->string('sync_status')->toString()) {
                    'synced' => $query->whereNotNull('master_synced_at'),
                    'unsynced' => $query->whereNull('master_synced_at'),
                    default => null,
                };
            });

        $statsQuery = clone $studentsQuery;

        $students = $studentsQuery
            ->orderByDesc('master_synced_at')
            ->orderBy('nama')
            ->paginate(15)
            ->withQueryString();

        $students->through(function (Mahasiswa $mahasiswa) {
            $faculty = $mahasiswa->fakultas ?? $mahasiswa->prodi?->fakultas;

            return [
                'id' => $mahasiswa->id,
                'nim' => $mahasiswa->nim,
                'nik' => $mahasiswa->nik,
                'nama' => $mahasiswa->nama,
                'mother_name' => $mahasiswa->mother_name,
                'batch_year' => $mahasiswa->batch_year,
                'gender' => $mahasiswa->gender,
                'sks_completed' => $mahasiswa->sks_completed,
                'gpa' => $mahasiswa->gpa,
                'is_bta_ppi_passed' => $mahasiswa->is_bta_ppi_passed,
                'master_id' => $mahasiswa->master_id,
                'master_synced_at' => $mahasiswa->master_synced_at?->toIso8601String(),
                'address' => $mahasiswa->user?->address,
                'fakultas' => $faculty ? [
                    'id' => $faculty->id,
                    'nama' => $faculty->nama,
                ] : null,
                'prodi' => $mahasiswa->prodi ? [
                    'id' => $mahasiswa->prodi->id,
                    'nama' => $mahasiswa->prodi->nama,
                ] : null,
                'account' => $mahasiswa->user ? [
                    'id' => $mahasiswa->user->id,
                    'username' => $mahasiswa->user->username,
                    'name' => $mahasiswa->user->name,
                    'email' => $mahasiswa->user->email,
                    'is_active' => $mahasiswa->user->is_active,
                ] : null,
                'has_account' => $mahasiswa->user !== null,
            ];
        });

        $lastSyncedAt = Mahasiswa::query()
            ->whereNotNull('master_synced_at')
            ->latest('master_synced_at')
            ->value('master_synced_at');

        $batchYears = Mahasiswa::query()
            ->whereNotNull('batch_year')
            ->distinct()
            ->orderByDesc('batch_year')
            ->pluck('batch_year')
            ->values();

        return Inertia::render('Admin/System/Users/MahasiswaIndex', [
            'students' => $this->formatPaginator($students),
            'filters' => $filters,
            'faculties' => Fakultas::query()
                ->orderBy('nama')
                ->get(['id', 'nama'])
                ->map(fn (Fakultas $faculty) => ['id' => $faculty->id, 'name' => $faculty->nama]),
            'programs' => Prodi::query()
                ->orderBy('nama')
                ->get(['id', 'faculty_id', 'nama'])
                ->map(fn (Prodi $program) => [
                    'id' => $program->id,
                    'faculty_id' => $program->faculty_id,
                    'name' => $program->nama,
                ]),
            'batchYears' => $batchYears,
            'stats' => [
                'total' => (clone $statsQuery)->count(),
                'with_account' => (clone $statsQuery)->whereHas('user')->count(),
                'active_accounts' => (clone $statsQuery)->whereHas('user', fn ($query) => $query->where('is_active', true))->count(),
                'bta_passed' => (clone $statsQuery)->where('is_bta_ppi_passed', true)->count(),
                'synced' => (clone $statsQuery)->whereNotNull('master_synced_at')->count(),
            ],
            'syncInfo' => [
                'mode' => 'sync-only',
                'source' => 'Master API Kampus',
                'last_synced_at' => optional($lastSyncedAt)->format('d M Y H:i'),
            ],
            'title' => 'Registry Mahasiswa Master',
        ]);
    }

    public function create(): Response
    {
        $faculties = Fakultas::orderBy('nama')->get()
            ->map(fn ($f) => ['id' => $f->id, 'name' => $f->nama]);
        $programs = Prodi::orderBy('nama')->get()
            ->map(fn ($p) => ['id' => $p->id, 'name' => $p->nama]);

        return Inertia::render('Admin/System/Users/Form', [
            'faculties' => $faculties,
            'programs' => $programs,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'max:50', 'unique:users,username'],
            'name' => ['required', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::min(8)->mixedCase()->numbers()->symbols()],
            'role' => ['required', 'in:superadmin,faculty_admin,dpl,student'],
            // Student fields
            'nim' => ['required_if:role,student', 'nullable', 'string', 'max:20'],
            'faculty_id' => ['required_if:role,student,dpl,faculty_admin', 'nullable', 'exists:fakultas,id'],
            'program_id' => ['required_if:role,student', 'nullable', 'exists:prodi,id'],
            'batch_year' => ['required_if:role,student', 'nullable', 'integer'],
            'gender' => ['required_if:role,student', 'nullable', 'in:L,P'],
            // Lecturer fields
            'nip' => ['required_if:role,dpl', 'nullable', 'string', 'max:20'],
        ]);

        // Constraint: Only 1 superadmin account allowed
        if ($validated['role'] === 'superadmin' && User::role('superadmin')->count() >= 1) {
            return back()->withErrors(['role' => 'Akun Superadmin sudah ada dan hanya boleh ada satu.'])->withInput();
        }

        $user = User::create([
            'username' => $validated['username'],
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_active' => true,
            'must_change_password' => true, // Force change on first login
            'faculty_id' => $validated['role'] === 'faculty_admin' ? $validated['faculty_id'] : null,
        ]);

        $user->assignRole($validated['role']);

        if ($validated['role'] === 'student' && ! empty($validated['nim'])) {
            Mahasiswa::create([
                'user_id' => $user->id,
                'nim' => $validated['nim'],
                'nama' => $validated['name'],
                'faculty_id' => $validated['faculty_id'],
                'program_id' => $validated['program_id'],
                'batch_year' => $validated['batch_year'],
                'gender' => $validated['gender'],
            ]);

            // Sync nama user dengan nama mahasiswa
            $user->update(['name' => $validated['name']]);
        }

        if ($validated['role'] === 'dpl' && ! empty($validated['nip'])) {
            Dosen::create([
                'user_id' => $user->id,
                'nip' => $validated['nip'],
                'nama' => $validated['name'],
                'faculty_id' => $validated['faculty_id'] ?? Fakultas::first()?->id,
            ]);
        }

        // Notify user about their new account
        $roleLabel = match ($validated['role']) {
            'student' => 'Mahasiswa',
            'dpl' => 'Dosen Pembimbing Lapangan',
            'faculty_admin' => 'Admin Fakultas',
            'superadmin' => 'Super Administrator',
            default => 'Pengguna',
        };

        $user->notify(new AccountActivatedNotification(
            $user->name,
            $user->username,
            $roleLabel,
            $validated['password'] // In manual creation, we can pass the password
        ));

        return redirect()->route('admin.pengguna.index')->with('success', 'Pengguna berhasil ditambahkan.');
    }

    public function toggleActive(User $user): RedirectResponse
    {
        // Pastikan hanya mahasiswa yang bisa di-toggle
        if (! $user->hasRole('student')) {
            return redirect()->back()->withErrors(['error' => 'Hanya dapat mengubah status mahasiswa.']);
        }

        $user->update(['is_active' => ! $user->is_active]);
        $status = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';

        if ($user->is_active) {
            $user->notify(new AccountActivatedNotification(
                $user->name,
                $user->username,
                'Mahasiswa',
                null // No password passed on reactivation
            ));
        }

        return redirect()->back()->with('success', "Pengguna berhasil {$status}.");
    }

    public function resetTemporaryPassword(User $user): RedirectResponse
    {
        $temporaryPassword = Str::password(12);

        $user->forceFill([
            'password' => Hash::make($temporaryPassword), // Explicit hashing for defense-in-depth
            'must_change_password' => true,
            'password_changed_at' => null,
            'remember_token' => Str::random(60),
        ])->save();

        session()->flash('temporary_password_display', [
            'username' => $user->username,
            'password' => $temporaryPassword,
            'expires_at' => now()->addMinutes(5), // Auto-expire after 5 minutes
        ]);

        return redirect()->back()
            ->with('temporary_username', $user->username)
            ->with('temporary_password', $temporaryPassword)
            ->with('success', "Password sementara untuk akun {$user->username} berhasil dibuat. Silakan lihat di halaman ini untuk menyalin password.");
    }

    /**
     * Get and clear the temporary password display data.
     * This ensures the password is only shown once and then removed.
     */
    public function getTemporaryPasswordDisplay(): ?array
    {
        $data = session()->pull('temporary_password_display');

        if (! $data && session()->has('temporary_username') && session()->has('temporary_password')) {
            $data = [
                'username' => session('temporary_username'),
                'password' => session('temporary_password'),
            ];
        }

        if ($data && isset($data['expires_at']) && now()->lt($data['expires_at'])) {
            return $data;
        }

        if ($data && ! isset($data['expires_at'])) {
            return $data;
        }

        // Expired or not found
        return null;
    }
}
