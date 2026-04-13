<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Fakultas;
use App\Traits\HandlesPagination;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class FakultasController extends Controller
{
    use HandlesPagination;

    public function index(Request $request): Response
    {
        Gate::authorize('manage-master-data');
        $faculties = Fakultas::query()
            ->when($request->search, function ($query, $search) {
                $s = str_replace(['%', '_'], ['\\%', '\\_'], $search);

                $query->where(function ($inner) use ($s) {
                    $inner->where('nama', 'like', "%{$s}%")
                        ->orWhere('code', 'like', "%{$s}%");
                });
            })
            ->withCount('prodi')
            ->orderBy('nama')
            ->paginate(10)
            ->withQueryString();

        $faculties->getCollection()->transform(fn (Fakultas $faculty) => [
            'id' => $faculty->id,
            'code' => $faculty->code,
            'name' => $faculty->nama,
            'programs_count' => $faculty->prodi_count,
        ]);

        $lastSyncedAt = Fakultas::query()
            ->whereNotNull('master_synced_at')
            ->latest('master_synced_at')
            ->first()?->master_synced_at;

        return Inertia::render('Admin/MasterData/Faculties/Index', [
            'faculties' => $this->formatPaginator($faculties),
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
        return $this->syncOnlyResponse('fakultas');
    }

    public function update(Request $request, Fakultas $fakultas): RedirectResponse
    {
        return $this->syncOnlyResponse('fakultas');
    }

    public function destroy(Fakultas $fakultas): RedirectResponse
    {
        return $this->syncOnlyResponse('fakultas');
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
