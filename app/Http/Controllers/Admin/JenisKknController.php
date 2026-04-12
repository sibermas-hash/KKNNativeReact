<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\JenisKkn;
use App\Services\RedisCacheService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\KKN\PesertaKkn;
use Illuminate\Support\Facades\DB;

class JenisKknController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('manage-master-data');

        $jenisKkn = JenisKkn::query()
            ->when($request->search, fn ($q, $s) => $q
                ->where('name', 'ilike', "%{$s}%")
                ->orWhere('code', 'ilike', "%{$s}%")
            )
            ->ordered()
            ->get()
            ->map(fn ($j) => [
                'id' => $j->id,
                'code' => $j->code,
                'name' => $j->name,
                'description' => $j->description,
                'registration_mode' => $j->registration_mode,
                'placement_mode' => $j->placement_mode,
                'registration_mode_label' => $j->registrationModeLabel(),
                'placement_mode_label' => $j->placementModeLabel(),
                'min_sks' => $j->min_sks,
                'min_gpa' => $j->min_gpa,
                'color' => $j->color,
                'is_active' => $j->is_active,
                'sort_order' => $j->sort_order,
                'periodes_count' => $j->periodes()->count(),
            ]);

        return Inertia::render('Admin/MasterData/JenisKkn/Index', [
            'jenisKkn' => $jenisKkn,
            'filters' => $request->only('search'),
            'registrationModes' => [
                ['value' => 'open', 'label' => 'Pendaftaran Terbuka Mandiri'],
                ['value' => 'selective', 'label' => 'Seleksi Khusus oleh Panitia/LPPM'],
                ['value' => 'proposal_based', 'label' => 'Berbasis Proposal/Program Dosen'],
            ],
            'placementModes' => [
                ['value' => 'automatic_after_approval', 'label' => 'Otomatis oleh Sistem'],
                ['value' => 'manual_admin', 'label' => 'Manual oleh Admin/LPPM'],
                ['value' => 'host_defined', 'label' => 'Ditentukan oleh Mitra/Host'],
                ['value' => 'proposal_defined', 'label' => 'Mengikuti Desain Proposal'],
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('manage-master-data');

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'alpha_dash', Rule::unique('jenis_kkn', 'code')],
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'registration_mode' => ['required', Rule::in(['open', 'selective', 'proposal_based'])],
            'placement_mode' => ['required', Rule::in(['automatic_after_approval', 'manual_admin', 'host_defined', 'proposal_defined'])],
            'min_sks' => ['required', 'integer', 'min:0', 'max:200'],
            'min_gpa' => ['required', 'numeric', 'min:0', 'max:4.00'],
            'color' => ['nullable', 'string', 'max:20'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        $validated['code'] = strtoupper($validated['code']);

        JenisKkn::create($validated);
        RedisCacheService::invalidateMasterData();

        return redirect()->route('admin.jenis-kkn.index')
            ->with('success', "Jenis KKN '{$validated['name']}' berhasil ditambahkan.");
    }

    public function update(Request $request, JenisKkn $jenisKkn): RedirectResponse
    {
        Gate::authorize('manage-master-data');

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'alpha_dash', Rule::unique('jenis_kkn', 'code')->ignore($jenisKkn->id)],
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'registration_mode' => ['required', Rule::in(['open', 'selective', 'proposal_based'])],
            'placement_mode' => ['required', Rule::in(['automatic_after_approval', 'manual_admin', 'host_defined', 'proposal_defined'])],
            'min_sks' => ['required', 'integer', 'min:0', 'max:200'],
            'min_gpa' => ['required', 'numeric', 'min:0', 'max:4.00'],
            'color' => ['nullable', 'string', 'max:20'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        $validated['code'] = strtoupper($validated['code']);

        $jenisKkn->update($validated);
        RedisCacheService::invalidateMasterData();

        return redirect()->route('admin.jenis-kkn.index')
            ->with('success', "Jenis KKN '{$validated['name']}' berhasil diperbarui.");
    }

    public function destroy(JenisKkn $jenisKkn): RedirectResponse
    {
        Gate::authorize('manage-master-data');

        $count = $jenisKkn->periodes()->count();
        if ($count > 0) {
            return redirect()->route('admin.jenis-kkn.index')
                ->with('error', "Tidak dapat menghapus: masih digunakan oleh {$count} periode.");
        }

        $name = $jenisKkn->name;
        $jenisKkn->delete();
        RedisCacheService::invalidateMasterData();

        return redirect()->route('admin.jenis-kkn.index')
            ->with('success', "Jenis KKN '{$name}' berhasil dihapus.");
    }

    public function show(JenisKkn $jenisKkn, Request $request): Response
    {
        Gate::authorize('manage-master-data');

        // Stats per status
        $stats = PesertaKkn::whereHas('periode', fn($q) => $q->where('jenis_kkn_id', $jenisKkn->id))
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');

        $registrations = PesertaKkn::with([
                'mahasiswa:id,user_id,nim,nama,faculty_id,program_id',
                'mahasiswa.user:id,name,email,phone',
                'mahasiswa.fakultas:id,nama',
                'periode:id,name,periode',
                'kelompok:id,period_id,nama_kelompok,code',
            ])
            ->whereHas('periode', fn($q) => $q->where('jenis_kkn_id', $jenisKkn->id))
            ->when($request->search, function($q, $s) {
                $q->whereHas('mahasiswa', fn($m) => $m->where('nama', 'ilike', "%{$s}%")->orWhere('nim', 'ilike', "%{$s}%"));
            })
            ->orderByDesc('created_at')
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('Admin/MasterData/JenisKkn/Show', [
            'jenisKkn' => [
                'id' => $jenisKkn->id,
                'name' => $jenisKkn->name,
                'code' => $jenisKkn->code,
                'description' => $jenisKkn->description,
                'registration_mode_label' => $jenisKkn->registrationModeLabel(),
                'placement_mode_label' => $jenisKkn->placementModeLabel(),
                'min_sks' => $jenisKkn->min_sks,
                'min_gpa' => $jenisKkn->min_gpa,
                'is_active' => $jenisKkn->is_active,
                'color' => $jenisKkn->color,
            ],
            'stats' => [
                'total' => $stats->sum(),
                'approved' => $stats->get('approved', 0),
                'pending' => $stats->get('pending', 0),
                'rejected' => $stats->get('rejected', 0),
            ],
            'registrations' => $registrations,
            'filters' => $request->only('search'),
        ]);
    }
}
