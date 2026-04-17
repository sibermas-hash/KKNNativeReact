<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\ProgramKerja;
use App\Traits\HandlesPagination;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Ai\Ai;

class ProgramKerjaController extends Controller
{
    use HandlesPagination;

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

        $workPrograms = $query->with(['kelompok.lokasi'])
            ->orderByDesc('submitted_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Monitoring/WorkPrograms/Index', [
            'workPrograms' => $this->formatPaginator($workPrograms),
            'sdg_distribution' => Inertia::defer(function () use ($query) {
                $sdgCounts = array_fill(1, 17, 0);

                // Optimized for memory stability using chunking
                (clone $query)->select('sdg_goals')->chunk(200, function ($programs) use (&$sdgCounts) {
                    foreach ($programs as $item) {
                        $goals = is_array($item->sdg_goals) ? $item->sdg_goals : [];
                        foreach ($goals as $goalId) {
                            if (isset($sdgCounts[$goalId])) {
                                $sdgCounts[$goalId]++;
                            }
                        }
                    }
                });

                return $sdgCounts;
            }),
            'filters' => $request->only('status', 'semantic_search'),
            'semantic_results' => $request->filled('semantic_search')
                ? Inertia::defer(function () use ($request) {
                    try {
                        $embeddings = Ai::embeddings([$request->input('semantic_search')]);
                        if (empty($embeddings)) {
                            return [];
                        }

                        return ProgramKerja::whereVector('title', $embeddings[0])->take(5)->get();
                    } catch (\Exception $e) {
                        \Log::error('AI Semantic Search Failed: '.$e->getMessage());

                        return [];
                    }
                })
                : null,
        ]);
    }
}
