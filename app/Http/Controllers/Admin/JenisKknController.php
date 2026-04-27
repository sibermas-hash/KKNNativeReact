<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\JenisKkn;
use App\Models\KKN\PesertaKkn;
use App\Services\KKN\RequirementBuilderService;
use App\Services\RedisCacheService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

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
                'require_not_married' => (bool) $j->require_not_married,
                'require_parent_permission' => (bool) $j->require_parent_permission,
                'require_health_certificate' => (bool) $j->require_health_certificate,
                'require_bta_ppi' => (bool) $j->require_bta_ppi,
                'specific_prodi_ids' => is_array($j->specific_prodi_ids) ? array_map('intval', $j->specific_prodi_ids) : [],
                'custom_requirements' => $j->custom_requirements ?? [],
                'required_documents' => $j->required_documents ?? [],
                'allowed_regencies' => $j->allowed_regencies ?? [],
                'color' => $j->color,
                'is_active' => $j->is_active,
                'sort_order' => $j->sort_order,
                'periodes_count' => $j->periodes()->count(),
                'requirements_config' => $j->requirements_config ?? [],
                'attendance_config' => $j->getAttendanceConfig(),
            ]);

        return Inertia::render('Admin/MasterData/JenisKkn/Index', [
            'jenisKkn' => $jenisKkn,
            'filters' => $request->only('search'),
            'prodis' => \App\Models\KKN\Prodi::orderBy('nama')->get(['id', 'nama']),
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
                ['value' => 'self_determined', 'label' => 'Mandiri (Mahasiswa Tentukan Lokasi)'],
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
            'placement_mode' => ['required', Rule::in(['automatic_after_approval', 'manual_admin', 'host_defined', 'proposal_defined', 'self_determined'])],
            'min_sks' => ['required', 'integer', 'min:0', 'max:200'],
            'min_gpa' => ['required', 'numeric', 'min:0', 'max:4.00'],
            'require_not_married' => ['boolean'],
            'require_parent_permission' => ['boolean'],
            'require_health_certificate' => ['boolean'],
            'require_bta_ppi' => ['boolean'],
            'specific_prodi_ids' => ['nullable', 'array'],
            'specific_prodi_ids.*' => ['integer', 'exists:prodi,id'],
            'custom_requirements' => ['nullable', 'array'],
            'custom_requirements.*' => ['string', 'max:255'],
            'required_documents' => ['nullable', 'array'],
            'required_documents.*' => ['string', 'max:100'],
            'allowed_regencies' => ['nullable', 'array'],
            'allowed_regencies.*' => ['string', 'max:50'],
            'color' => ['nullable', 'string', 'max:20'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
            'requirements_config' => ['nullable', 'array'],
            'requirements_config.*.name' => ['required', 'string', 'max:100'],
            'requirements_config.*.type' => ['required', 'string', Rule::in(['upload', 'db_check'])],
            'requirements_config.*.field' => ['nullable', 'string'],
            'requirements_config.*.min_value' => ['nullable'],
            'requirements_config.*.expected_value' => ['nullable'],
            'attendance_config' => ['nullable', 'array'],
            'attendance_config.geofence_enabled' => ['boolean'],
            'attendance_config.radius_meters' => ['integer', 'min:1'],
            'attendance_config.location_source' => ['string', Rule::in(['posko', 'domisili'])],
            'attendance_config.require_photo' => ['boolean'],
            'attendance_config.allow_offline_sync' => ['boolean'],
        ]);

        $validated['code'] = strtoupper($validated['code']);

        // Validate requirements_config using RequirementBuilderService
        if (!empty($validated['requirements_config'])) {
            RequirementBuilderService::validateRequirementsConfig($validated['requirements_config']);
        }

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
            'placement_mode' => ['required', Rule::in(['automatic_after_approval', 'manual_admin', 'host_defined', 'proposal_defined', 'self_determined'])],
            'min_sks' => ['required', 'integer', 'min:0', 'max:200'],
            'min_gpa' => ['required', 'numeric', 'min:0', 'max:4.00'],
            'require_not_married' => ['boolean'],
            'require_parent_permission' => ['boolean'],
            'require_health_certificate' => ['boolean'],
            'require_bta_ppi' => ['boolean'],
            'specific_prodi_ids' => ['nullable', 'array'],
            'specific_prodi_ids.*' => ['integer', 'exists:prodi,id'],
            'custom_requirements' => ['nullable', 'array'],
            'custom_requirements.*' => ['string', 'max:255'],
            'required_documents' => ['nullable', 'array'],
            'required_documents.*' => ['string', 'max:100'],
            'allowed_regencies' => ['nullable', 'array'],
            'allowed_regencies.*' => ['string', 'max:50'],
            'color' => ['nullable', 'string', 'max:20'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
            'requirements_config' => ['nullable', 'array'],
            'requirements_config.*.name' => ['required', 'string', 'max:100'],
            'requirements_config.*.type' => ['required', 'string', Rule::in(['upload', 'db_check'])],
            'requirements_config.*.field' => ['nullable', 'string'],
            'requirements_config.*.min_value' => ['nullable'],
            'requirements_config.*.expected_value' => ['nullable'],
            'attendance_config' => ['nullable', 'array'],
            'attendance_config.geofence_enabled' => ['boolean'],
            'attendance_config.radius_meters' => ['integer', 'min:1'],
            'attendance_config.location_source' => ['string', Rule::in(['posko', 'domisili'])],
            'attendance_config.require_photo' => ['boolean'],
            'attendance_config.allow_offline_sync' => ['boolean'],
        ]);

        $validated['code'] = strtoupper($validated['code']);

        // Validate requirements_config using RequirementBuilderService
        if (!empty($validated['requirements_config'])) {
            RequirementBuilderService::validateRequirementsConfig($validated['requirements_config']);
        }

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
        $stats = PesertaKkn::whereHas('periode', fn ($q) => $q->where('jenis_kkn_id', $jenisKkn->id))
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');

        $registrations = PesertaKkn::with([
            'mahasiswa:id,user_id,nim,nama,fakultas_id,prodi_id',
            'mahasiswa.user:id,name,email,phone',
            'mahasiswa.fakultas:id,nama',
            'periode:id,name,periode',
            'kelompok:id,periode_id,nama_kelompok,code',
        ])
            ->whereHas('periode', fn ($q) => $q->where('jenis_kkn_id', $jenisKkn->id))
            ->when($request->search, function ($q, $s) {
                $q->whereHas('mahasiswa', fn ($m) => $m->where('nama', 'ilike', "%{$s}%")->orWhere('nim', 'ilike', "%{$s}%"));
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
