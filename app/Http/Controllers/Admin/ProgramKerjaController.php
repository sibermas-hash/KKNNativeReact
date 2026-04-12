<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\ProgramKerja;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ProgramKerjaController extends Controller
{
    use \App\Traits\HandlesPagination;

    public function index(Request $request): Response
    {
        Gate::authorize('view-reports');
        $status = $request->input('status');

        $user = auth()->user();
        $isFacultyAdmin = $user?->hasRole('faculty_admin');
        $facultyId = $isFacultyAdmin ? $user?->faculty_id : null;

        $query = ProgramKerja::query()
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($facultyId, function ($query, $id) {
                $query->whereHas('kelompok.peserta.mahasiswa', fn ($q) => $q->where('faculty_id', $id));
            });

        $workPrograms = (clone $query)->with(['kelompok.lokasi'])
            ->orderByDesc('submitted_at')
            ->paginate(15)
            ->withQueryString();

        // Calculate SDG distribution for the filtered set
        $sdgCounts = array_fill(1, 17, 0);
        (clone $query)->get(['sdg_goals'])->each(function ($item) use (&$sdgCounts) {
            $goals = is_array($item->sdg_goals) ? $item->sdg_goals : [];
            foreach ($goals as $goalId) {
                if (isset($sdgCounts[$goalId])) {
                    $sdgCounts[$goalId]++;
                }
            }
        });

        $sdgDistribution = collect($sdgCounts)->map(fn ($count, $id) => [
            'id' => $id,
            'count' => $count,
        ])->values();

        return Inertia::render('Admin/Monitoring/WorkPrograms/Index', [
            'workPrograms' => $this->formatPaginator($workPrograms),
            'sdg_distribution' => $sdgDistribution,
            'filters' => $request->only('status'),
        ]);
    }
}
