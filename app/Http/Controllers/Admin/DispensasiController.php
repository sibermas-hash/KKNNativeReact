<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\DispensasiKkn;
use App\Models\KKN\Periode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DispensasiController extends Controller
{
    public function index(Request $request): Response
    {
        try {
            $dispensasi = DispensasiKkn::with(['periode:id,name,periode', 'grantedByUser:id,name'])
                ->when($request->input('search'), fn ($q, $search) => $q->where('nim', 'ilike', "%{$search}%")
                    ->orWhere('alasan', 'ilike', "%{$search}%")
                )
                ->latest()
                ->paginate(15)
                ->withQueryString();

            $periods = Periode::orderByDesc('periode')->get(['id', 'name', 'periode']);

            return Inertia::render('Admin/Operational/Dispensasi/Index', [
                'dispensasi' => $dispensasi,
                'periods' => $periods,
                'filters' => $request->only('search'),
            ]);
        } catch (\Throwable $e) {
            report($e);

            return Inertia::render('Admin/Operational/Dispensasi/Index', [
                'dispensasi' => ['data' => [], 'meta' => ['total' => 0, 'per_page' => 15, 'current_page' => 1]],
                'periods' => [],
                'filters' => [],
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nim' => ['required', 'string', 'max:20'],
            'period_id' => ['nullable', 'exists:App\Models\KKN\Periode,id'],
            'alasan' => ['required', 'string', 'max:500'],
            'bypassed_requirements' => ['nullable', 'array'],
            'bypassed_requirements.*' => ['string', 'in:min_sks,min_gpa,bta_ppi,documents,personal_status,program_prodi'],
        ]);

        $validated['granted_by'] = auth()->id();
        $validated['is_active'] = true;

        DispensasiKkn::create($validated);

        return back()->with('success', "Dispensasi untuk NIM {$validated['nim']} berhasil ditambahkan.");
    }

    public function destroy(DispensasiKkn $dispensasi): RedirectResponse
    {
        $nim = $dispensasi->nim;
        $dispensasi->update(['is_active' => false]);

        return back()->with('success', "Dispensasi NIM {$nim} telah dicabut.");
    }
}
