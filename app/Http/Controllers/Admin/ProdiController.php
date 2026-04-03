<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Prodi;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;
use Inertia\Response;

class ProdiController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('manage-master-data');
        $programs = Prodi::query()
            ->with('fakultas')
            ->when($request->search, function ($query, $search) {
                $s = str_replace(['%', '_'], ['\\%', '\\_'], $search);

                $query->where(function ($inner) use ($s) {
                    $inner->where('nama', 'like', "%{$s}%")
                        ->orWhere('code', 'like', "%{$s}%")
                        ->orWhereHas('fakultas', function ($facultyQuery) use ($s) {
                            $facultyQuery->where('nama', 'like', "%{$s}%");
                        });
                });
            })
            ->orderBy('nama')
            ->paginate(10)
            ->withQueryString();

        $programs->getCollection()->transform(fn (Prodi $program) => [
            'id' => $program->id,
            'code' => $program->code,
            'name' => $program->nama,
            'faculty' => $program->fakultas ? [
                'id' => $program->fakultas->id,
                'name' => $program->fakultas->nama,
            ] : null,
        ]);

        $lastSyncedAt = Prodi::query()
            ->whereNotNull('master_synced_at')
            ->latest('master_synced_at')
            ->first()?->master_synced_at;

        return Inertia::render('Admin/Programs/Index', [
            'programs' => $programs,
            'faculties' => Fakultas::query()
                ->orderBy('nama')
                ->get()
                ->map(fn (Fakultas $faculty) => [
                    'id' => $faculty->id,
                    'name' => $faculty->nama,
                ]),
            'filters' => $request->only('search'),
            'syncInfo' => [
                'mode' => 'sync-only',
                'source' => 'Master Mahasiswa',
                'last_synced_at' => $lastSyncedAt?->format('d M Y H:i'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        return $this->syncOnlyResponse('program studi');
    }

    public function update(Request $request, Prodi $program): RedirectResponse
    {
        return $this->syncOnlyResponse('program studi');
    }

    public function destroy(Prodi $program): RedirectResponse
    {
        return $this->syncOnlyResponse('program studi');
    }

    private function syncOnlyResponse(string $label): RedirectResponse
    {
        return redirect()->back()->with(
            'error',
            sprintf(
                'Data %s mengikuti sinkronisasi master mahasiswa dan tidak dapat diubah manual.',
                $label
            )
        );
    }
}
