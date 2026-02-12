<?php

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

        if ($user->hasRole('dpl')) {
            return redirect()->route('dpl.dashboard');
        }

        return redirect()->route('student.dashboard');
    }
}
