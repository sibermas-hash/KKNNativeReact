<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\KegiatanKkn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class KegiatanKknController extends Controller
{
    public function index(Request $request): Response
    {
        if (!auth()->user()->hasAnyRole(['superadmin', 'admin', 'faculty_admin', 'dpl'])) {
            abort(403, 'Anda tidak memiliki hak akses untuk melihat laporan harian.');
        }

        $status = $request->input('status');

        $user = auth()->user();
        $isFacultyAdmin = $user?->hasRole('faculty_admin');
        $facultyId = $isFacultyAdmin ? $user?->faculty_id : null;

        $reports = KegiatanKkn::with([
                'mahasiswa' => fn($q) => $q->select('id', 'user_id', 'nama as name', 'nim'),
                'kelompok' => fn($q) => $q->select('id', 'nama_kelompok as name')
            ])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($facultyId, fn ($q) => $q->whereHas('mahasiswa', fn ($m) => $m->where('faculty_id', $facultyId)))
            ->orderByDesc('date')
            ->paginate(15)
            ->withQueryString();

        // Map relation name to 'student' for frontend consistency
        $reports->getCollection()->transform(function ($report) {
            $report->student = $report->mahasiswa;
            $report->group = $report->kelompok;
            unset($report->mahasiswa);
            unset($report->kelompok);
            return $report;
        });

        return Inertia::render('Admin/DailyReports/Index', [
            'reports' => $reports,
            'filters' => $request->only('status'),
        ]);
    }
}
