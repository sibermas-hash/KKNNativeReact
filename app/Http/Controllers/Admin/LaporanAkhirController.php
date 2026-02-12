<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\LaporanAkhir;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LaporanAkhirController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->input('status');

        $reports = LaporanAkhir::with(['mahasiswa', 'kelompok'])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->orderByDesc('submitted_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/FinalReports/Index', [
            'reports' => $reports,
            'filters' => $request->only('status'),
        ]);
    }
}
