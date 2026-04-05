<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\LaporanAkhir;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class LaporanAkhirController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('view-reports');
        $status = $request->input('status');

        $user = auth()->user();
        $isFacultyAdmin = $user?->hasRole('faculty_admin');
        $facultyId = $isFacultyAdmin ? $user?->faculty_id : null;

        $reports = LaporanAkhir::with(['mahasiswa', 'kelompok'])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($facultyId, fn ($q) => $q->whereHas('mahasiswa', fn ($m) => $m->where('faculty_id', $facultyId)))
            ->orderByDesc('submitted_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/FinalReports/Index', [
            'reports' => $reports,
            'filters' => $request->only('status'),
        ]);
    }
}
