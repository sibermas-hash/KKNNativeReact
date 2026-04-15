<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\KegiatanKkn;
use App\Services\KKN\FacultyScopeService;
use App\Traits\HandlesPagination;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KegiatanKknController extends Controller
{
    use HandlesPagination;

    public function index(Request $request): Response
    {
        if (! auth()->user()->hasAnyRole(['superadmin', 'admin', 'faculty_admin', 'dpl'])) {
            abort(403, 'Anda tidak memiliki hak akses untuk melihat laporan harian.');
        }

        $status = $request->input('status');

        $query = KegiatanKkn::with([
            'mahasiswa' => fn ($q) => $q->select('id', 'user_id', 'nama as name', 'nim'),
            'kelompok' => fn ($q) => $q->select('id', 'nama_kelompok as name'),
        ])
            ->when($status, fn ($q) => $q->where('status', $status));

        // Centralized faculty scoping
        $paginator = FacultyScopeService::apply($query, 'mahasiswa.faculty_id')
            ->orderByDesc('date')
            ->paginate(15)
            ->withQueryString();

        // Map relation name to 'student' for frontend consistency
        $paginator->getCollection()->transform(function ($report) {
            $report->student = $report->mahasiswa;
            $report->group = $report->kelompok;
            unset($report->mahasiswa);
            unset($report->kelompok);

            return $report;
        });

        return Inertia::render('Admin/Monitoring/DailyReports/Index', [
            'reports' => $this->formatPaginator($paginator),
            'filters' => $request->only('status'),
        ]);
    }
}
