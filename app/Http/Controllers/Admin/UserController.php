<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Dosen;
use App\Models\KKN\Prodi;
use App\Models\KKN\Mahasiswa;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::with(['roles', 'mahasiswa', 'dosen'])
            ->when($request->input('search'), function ($q, $search) {
                $s = str_replace(['%', '_'], ['\\%', '\\_'], $search);
                $q->where(function ($query) use ($s) {
                    $query->where('name', 'like', "%{$s}%")
                        ->orWhere('email', 'like', "%{$s}%")
                        ->orWhere('username', 'like', "%{$s}%");
                });
            })
            ->when($request->input('role'), fn($q, $role) => $q->role($role))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only('search', 'role'),
            'title' => 'Manajemen Semua Pengguna'
        ]);
    }

    public function dosenIndex(Request $request): Response
    {
        $users = User::role('dpl')
            ->with(['dosen'])
            ->when($request->input('search'), function ($q, $search) {
                $s = str_replace(['%', '_'], ['\\%', '\\_'], $search);
                $q->where(function ($query) use ($s) {
                    $query->where('name', 'like', "%{$s}%")
                        ->orWhere('email', 'like', "%{$s}%")
                        ->orWhereHas('dosen', fn($sq) => $sq->where('nip', 'like', "%{$s}%"));
                });
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Users/DosenIndex', [
            'users' => $users,
            'filters' => $request->only('search'),
            'title' => 'Manajemen Data Dosen (DPL)'
        ]);
    }

    public function mahasiswaIndex(Request $request): Response
    {
        $users = User::role('student')
            ->with(['mahasiswa.prodi.fakultas'])
            ->when($request->input('search'), function ($q, $search) {
                $s = str_replace(['%', '_'], ['\\%', '\\_'], $search);
                $q->where(function ($query) use ($s) {
                    $query->where('name', 'like', "%{$s}%")
                        ->orWhere('email', 'like', "%{$s}%")
                        ->orWhereHas('mahasiswa', fn($sq) => $sq->where('nim', 'like', "%{$s}%"));
                });
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Users/MahasiswaIndex', [
            'users' => $users,
            'filters' => $request->only('search'),
            'title' => 'Manajemen Data Mahasiswa'
        ]);
    }

    public function create(): Response
    {
        $faculties = Fakultas::orderBy('nama')->get()
            ->map(fn ($f) => ['id' => $f->id, 'name' => $f->nama]);
        $programs = Prodi::orderBy('nama')->get()
            ->map(fn ($p) => ['id' => $p->id, 'name' => $p->nama]);

        return Inertia::render('Admin/Users/Form', [
            'faculties' => $faculties,
            'programs' => $programs,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'max:50', 'unique:users,username'],
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', Password::min(8)->mixedCase()->numbers()->symbols()],
            'role' => ['required', 'in:superadmin,dpl,student'],
            // Student fields
            'nim' => ['required_if:role,student', 'nullable', 'string', 'max:20'],
            'faculty_id' => ['required_if:role,student', 'nullable', 'exists:fakultas,id'],
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
        ]);

        $user->assignRole($validated['role']);

        if ($validated['role'] === 'student' && !empty($validated['nim'])) {
            Mahasiswa::create([
                'user_id' => $user->id,
                'nim' => $validated['nim'],
                'nama' => $validated['name'],
                'faculty_id' => $validated['faculty_id'],
                'program_id' => $validated['program_id'],
                'batch_year' => $validated['batch_year'],
                'gender' => $validated['gender'],
            ]);
        }

        if ($validated['role'] === 'dpl' && !empty($validated['nip'])) {
            Dosen::create([
                'user_id' => $user->id,
                'nip' => $validated['nip'],
                'nama' => $validated['name'],
                'faculty_id' => $validated['faculty_id'] ?? Fakultas::first()?->id,
            ]);
        }

        return redirect()->route('admin.users.index')->with('success', 'Pengguna berhasil ditambahkan.');
    }

    public function toggleActive(User $user): RedirectResponse
    {
        $user->update(['is_active' => !$user->is_active]);
        $status = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()->with('success', "Pengguna berhasil {$status}.");
    }
}