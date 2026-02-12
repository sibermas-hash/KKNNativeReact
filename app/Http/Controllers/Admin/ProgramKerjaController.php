<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\ProgramKerja;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProgramKerjaController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->input('status');

        $workPrograms = ProgramKerja::with(['kelompok.lokasi'])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->orderByDesc('submitted_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/WorkPrograms/Index', [
            'workPrograms' => $workPrograms,
            'filters' => $request->only('status'),
        ]);
    }
}
