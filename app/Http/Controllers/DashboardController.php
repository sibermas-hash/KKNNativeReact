<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasRole('Admin') || $user->hasRole('superadmin')) {
            return redirect()->route('admin.dashboard');
        }

        if ($user->hasRole('dpl')) {
            return redirect()->route('dpl.dashboard');
        }

        if ($user->hasRole('faculty_admin')) {
            return redirect()->route('admin.rekap-nilai.index');
        }

        return redirect()->route('student.dashboard');
    }
}
