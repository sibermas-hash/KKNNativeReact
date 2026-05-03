<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasRole('admin') || $user->hasRole('superadmin') || $user->hasRole('faculty_admin')) {
            return redirect()->route('admin.hub');
        }

        if ($user->hasRole(['dosen', 'dpl'])) {
            return redirect()->route('dosen.dashboard');
        }

        return redirect()->route('student.dashboard');
    }
}
