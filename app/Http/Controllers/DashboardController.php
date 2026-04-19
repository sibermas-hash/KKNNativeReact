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

        if ($user->hasRole('admin') || $user->hasRole('superadmin')) {
            return redirect()->route('admin.dashboard');
        }

        if ($user->hasRole(['dosen', 'dpl'])) {
            return redirect()->route('dosen.dashboard');
        }

        if ($user->hasRole('faculty_admin')) {
            return redirect()->route('admin.grade-reports.index');
        }

        return redirect()->route('student.dashboard');
    }
}
