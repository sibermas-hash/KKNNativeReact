<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\Lecturer;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::with('roles')
            ->when($request->input('search'), function ($q, $search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%");
            })
            ->when($request->input('role'), function ($q, $role) {
                $q->role($role);
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only('search', 'role'),
        ]);
    }

    public function create(): Response
    {
        $faculties = Faculty::orderBy('name')->get();
        $programs = Program::orderBy('name')->get();

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
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'in:admin,dpl,student'],
            // Student fields
            'nim' => ['required_if:role,student', 'nullable', 'string', 'max:20'],
            'faculty_id' => ['required_if:role,student', 'nullable', 'exists:faculties,id'],
            'program_id' => ['required_if:role,student', 'nullable', 'exists:programs,id'],
            'batch_year' => ['required_if:role,student', 'nullable', 'integer'],
            'gender' => ['required_if:role,student', 'nullable', 'in:L,P'],
            // Lecturer fields
            'nip' => ['required_if:role,dpl', 'nullable', 'string', 'max:20'],
        ]);

        $user = User::create([
            'username' => $validated['username'],
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_active' => true,
        ]);

        $user->assignRole($validated['role']);

        if ($validated['role'] === 'student' && !empty($validated['nim'])) {
            Student::create([
                'user_id' => $user->id,
                'nim' => $validated['nim'],
                'name' => $validated['name'],
                'faculty_id' => $validated['faculty_id'],
                'program_id' => $validated['program_id'],
                'batch_year' => $validated['batch_year'],
                'gender' => $validated['gender'],
            ]);
        }

        if ($validated['role'] === 'dpl' && !empty($validated['nip'])) {
            Lecturer::create([
                'user_id' => $user->id,
                'nip' => $validated['nip'],
                'name' => $validated['name'],
                'faculty_id' => $validated['faculty_id'] ?? Faculty::first()?->id,
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
