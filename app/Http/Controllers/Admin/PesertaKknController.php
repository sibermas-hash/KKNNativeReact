<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\PesertaKkn;
use App\Services\KKN\KknRequirementService;
use App\Services\KKN\RegistrationApprovalService;
use App\Services\KKN\RegistrationExportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Storage;
use App\Traits\HandlesPagination;
use App\Notifications\KKN\RegistrationApprovedNotification;
use App\Notifications\KKN\RegistrationRejectedNotification;
use App\Notifications\KKN\GroupPlacementConfirmedNotification;

class PesertaKknController extends Controller
{
    use HandlesPagination;

    private function normalizeStatus(?string $status): ?string
    {
        if ($status === null || $status === '') {
            return null;
        }

        return match ($status) {
            'menunggu' => 'pending',
            'disetujui' => 'approved',
            'ditolak' => 'rejected',
            default => $status,
        };
    }

    private function registrationQuery(Request $request, bool $approvedOnly = false)
    {
        $status = $approvedOnly ? 'approved' : $this->normalizeStatus($request->input('status'));

        $query = PesertaKkn::with([
            'mahasiswa:id,user_id,nim,nama,faculty_id,program_id,nik,mother_name,gpa,is_bta_ppi_passed,sks_completed,health_certificate_path,parent_permission_path',
            'mahasiswa.user:id,name,email,address,phone',
            'mahasiswa.fakultas:id,code,nama',
            'mahasiswa.prodi:id,code,nama,faculty_id',
            'mahasiswa.prodi.fakultas:id,code,nama',
            'periode:id,periode,name,program_type,program_subtype,registration_mode,placement_mode,start_date,end_date',
            'kelompok:id,period_id,nama_kelompok,code',
        ])
            ->when($request->input('search'), fn ($query, $search) => $query->search($search))
            ->when($status, fn ($query, $value) => $query->where('status', $value))
            ->when($request->input('period_id'), fn ($query, $periodId) => $query->where('period_id', $periodId));

        // Use centralized Faculty Scoping service
        return \App\Services\KKN\FacultyScopeService::apply($query, 'mahasiswa.faculty_id');
    }

    /**
     * Download registration documents from local storage.
     */
    public function downloadDocument(
        Request $request,
        RegistrationApprovalService $approvalService
    ): \Symfony\Component\HttpFoundation\BinaryFileResponse {
        $path = $request->input('path');
        $user = auth()->user();

        $fullPath = $approvalService->downloadDocument($path, $user);

        // Ownership check for non-admin users
        if (! $user->hasAnyRole(['superadmin', 'faculty_admin'])) {
            $mahasiswa = \App\Models\KKN\Mahasiswa::where('user_id', $user->id)->first();

            if (! $mahasiswa) {
                abort(403, 'Akses identitas ditolak.');
            }

            $isOwner = ($mahasiswa->health_certificate_path === $path)
                || ($mahasiswa->parent_permission_path === $path);

            if (! $isOwner) {
                abort(403, 'Anda tidak memiliki hak akses untuk mendownload dokumen ini.');
            }
        }

        return response()->download($fullPath);
    }

    public function index(Request $request, KknRequirementService $kknRequirementService): Response
    {
        $registrations = $this->registrationQuery($request)
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        // Map data to match React frontend expectations
        $registrations->through(function (PesertaKkn $reg) use ($kknRequirementService) {
            $mahasiswa = $reg->mahasiswa;
            $periode = $reg->periode;
            
            $issues = [];
            if ($mahasiswa && $periode) {
                $issues = $kknRequirementService->validate($mahasiswa, $periode);
            }
            
            $isEligible = empty($issues);

            return [
                'id' => $reg->id,
                'status' => $reg->status,
                'registration_date' => $reg->registration_date,
                'notes' => $reg->notes,
                'rejection_reason' => $reg->rejection_reason,
                'revision_count' => (int) ($reg->revision_count ?? 0),
                'resubmitted_at' => $reg->resubmitted_at?->toIso8601String(),
                'is_eligible' => $isEligible,
                'eligibility_issues' => $issues,
                'student' => [
                    'nim' => $reg->mahasiswa?->nim,
                    'name' => $reg->mahasiswa?->nama ?? $reg->mahasiswa?->user?->name ?? '-',
                    'phone' => $reg->mahasiswa?->user?->phone,
                    'wa_link' => $reg->mahasiswa?->user?->phone
                        ? 'https://wa.me/' . preg_replace('/^0/', '62', preg_replace('/[^0-9]/', '', $reg->mahasiswa->user->phone))
                        : null,
                    'faculty' => $reg->mahasiswa?->fakultas ? ['name' => $reg->mahasiswa->fakultas->nama] : null,
                    'program' => $reg->mahasiswa?->prodi ? ['name' => $reg->mahasiswa->prodi->nama] : null,
                ],
                'period' => $reg->periode ? ['name' => $reg->periode->name, 'id' => $reg->periode->id] : ['name' => '-', 'id' => null],
                'group' => $reg->kelompok ? ['name' => $reg->kelompok->nama_kelompok] : null,
            ];
        });

        $statsQuery = PesertaKkn::query()
            ->selectRaw('mahasiswa.faculty_id, COUNT(*) as count')
            ->join('mahasiswa', 'peserta_kkn.mahasiswa_id', '=', 'mahasiswa.id')
            ->leftJoin('fakultas', 'mahasiswa.faculty_id', '=', 'fakultas.id')
            ->selectRaw('COALESCE(fakultas.nama, \'Tidak Diketahui\') as faculty_name')
            ->groupBy('mahasiswa.faculty_id', 'fakultas.nama')
            ->orderByDesc('count');

        // Apply centralized scoping to stats query
        $statsQuery = \App\Services\KKN\FacultyScopeService::apply($statsQuery, 'mahasiswa.faculty_id');

        $scopedTotalQuery = \App\Services\KKN\FacultyScopeService::apply(PesertaKkn::query(), 'mahasiswa.faculty_id');
        $scopedPendingQuery = \App\Services\KKN\FacultyScopeService::apply(PesertaKkn::query()->where('status', 'pending'), 'mahasiswa.faculty_id');
        $scopedApprovedQuery = \App\Services\KKN\FacultyScopeService::apply(PesertaKkn::query()->where('status', 'approved'), 'mahasiswa.faculty_id');
        $scopedRejectedQuery = \App\Services\KKN\FacultyScopeService::apply(PesertaKkn::query()->where('status', 'rejected'), 'mahasiswa.faculty_id');

        $stats = [
            'total' => $scopedTotalQuery->count(),
            'pending' => $scopedPendingQuery->count(),
            'approved' => $scopedApprovedQuery->count(),
            'rejected' => $scopedRejectedQuery->count(),
            'by_faculty' => $statsQuery
                ->get()
                ->map(function ($row) {
                    return [
                        'faculty_name' => $row->faculty_name,
                        'count' => $row->count,
                    ];
                }),
        ];

        // Registration summary per KKN type (mirrors Kampelmas "Detail Pendaftaran KKN")
        $byTypeStats = PesertaKkn::query()
            ->join('periode', 'peserta_kkn.period_id', '=', 'periode.id')
            ->selectRaw("periode.id as period_id, periode.name as period_name, periode.program_type, periode.kuota")
            ->selectRaw("COUNT(*) as total_pendaftar")
            ->selectRaw("SUM(CASE WHEN peserta_kkn.status = 'pending' THEN 1 ELSE 0 END) as pending")
            ->selectRaw("SUM(CASE WHEN peserta_kkn.status = 'approved' THEN 1 ELSE 0 END) as approved")
            ->selectRaw("SUM(CASE WHEN peserta_kkn.status = 'rejected' THEN 1 ELSE 0 END) as rejected")
            ->groupBy('periode.id', 'periode.name', 'periode.program_type', 'periode.kuota')
            ->orderBy('periode.id')
            ->get()
            ->map(fn ($row) => [
                'period_id' => $row->period_id,
                'jenis' => $row->period_name,
                'program_type' => $row->program_type,
                'kuota' => (int) $row->kuota,
                'pendaftar' => (int) $row->total_pendaftar,
                'pending' => (int) $row->pending,
                'setuju' => (int) $row->approved,
                'tolak' => (int) $row->rejected,
            ]);

        $periods = \App\Models\KKN\Periode::orderByDesc('is_active')->orderByDesc('periode')->get(['id', 'name', 'periode']);

        return Inertia::render('Admin/Operational/Registrations/Index', [
            'registrations' => $this->formatPaginator($registrations),
            'filters' => [
                'search' => $request->input('search'),
                'status' => $this->normalizeStatus($request->input('status')),
                'period_id' => $request->input('period_id'),
            ],
            'stats' => $stats,
            'byTypeStats' => $byTypeStats,
            'periods' => $periods,
        ]);
    }

    /**
     * Bulk approve registrations
     */
    public function bulkApprove(
        Request $request,
        RegistrationApprovalService $approvalService,
    ): RedirectResponse {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:peserta_kkn,id'],
        ]);

        $count = $approvalService->bulkApprove(
            $validated['ids'],
            auth()->id(),
            auth()->user()->hasRole('faculty_admin'),
            auth()->user()->faculty_id,
        );

        return redirect()->back()->with('success', "{$count} pendaftaran berhasil disetujui.");
    }

    /**
     * Bulk reject registrations
     */
    public function bulkReject(
        Request $request,
        RegistrationApprovalService $approvalService,
    ): RedirectResponse {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:peserta_kkn,id'],
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        $count = $approvalService->bulkReject(
            $validated['ids'],
            $validated['notes'],
            auth()->id(),
            auth()->user()->hasRole('faculty_admin'),
            auth()->user()->faculty_id,
        );

        return redirect()->back()->with('success', "{$count} pendaftaran ditolak.");
    }

    /**
     * Export registrations to Excel
     */
    public function export(
        Request $request,
        RegistrationExportService $exportService
    ): \Symfony\Component\HttpFoundation\BinaryFileResponse {
        $registrations = $this->registrationQuery($request)
            ->orderByDesc('created_at')
            ->get();

        return $exportService->exportToExcel($registrations);
    }

    public function exportBpjs(
        Request $request,
        RegistrationExportService $exportService
    ): \Symfony\Component\HttpFoundation\BinaryFileResponse {
        $registrations = $this->registrationQuery($request, approvedOnly: true)
            ->orderBy('approved_at')
            ->orderBy('created_at')
            ->get();

        return $exportService->exportBpjs($registrations);
    }

    public function show(PesertaKkn $pesertaKkn, KknRequirementService $kknRequirementService): Response
    {
        $pesertaKkn->load('mahasiswa.fakultas', 'mahasiswa.prodi', 'periode', 'kelompok', 'dokumen', 'rejector');

        $registration = $pesertaKkn->toArray();
        $registration['dokumen'] = $this->registrationDocuments($pesertaKkn);
        if ($pesertaKkn->periode) {
            $registration['periode'] = array_merge($registration['periode'] ?? [], [
                'registration_mode' => $pesertaKkn->periode->registration_mode,
                'placement_mode' => $pesertaKkn->periode->placement_mode,
                'program_type' => $pesertaKkn->periode->program_type,
                'program_subtype' => $pesertaKkn->periode->program_subtype,
                'governance' => $pesertaKkn->periode->governance(),
                'guide' => $kknRequirementService->describe($pesertaKkn->periode),
            ]);
        }

        return Inertia::render('Admin/Operational/Registrations/Show', [
            'registration' => $registration,
        ]);
    }

    public function approve(
        PesertaKkn $pesertaKkn,
        RegistrationApprovalService $approvalService,
    ): RedirectResponse {
        $approvalService->approve($pesertaKkn, auth()->id());

        // Notify student
        $pesertaKkn->load('mahasiswa.user', 'periode', 'kelompok');
        $user = $pesertaKkn->mahasiswa?->user;
        if ($user) {
            $user->notify(new RegistrationApprovedNotification(
                $pesertaKkn,
                $pesertaKkn->periode?->name ?? 'KKN',
                $pesertaKkn->kelompok?->nama_kelompok,
            ));
        }

        return redirect()->back()->with('success', 'Pendaftaran berhasil disetujui.');
    }

    public function reject(
        Request $request,
        PesertaKkn $pesertaKkn,
        RegistrationApprovalService $approvalService,
    ): RedirectResponse {
        $validated = $request->validate([
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        $pesertaKkn->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['notes'],
            'last_rejected_at' => now(),
            'last_rejected_by' => auth()->id(),
        ]);

        // Notify student
        $pesertaKkn->load('mahasiswa.user', 'periode');
        $user = $pesertaKkn->mahasiswa?->user;
        if ($user) {
            $user->notify(new RegistrationRejectedNotification(
                $pesertaKkn,
                $pesertaKkn->periode?->name ?? 'KKN',
                $validated['notes'],
            ));
        }

        return redirect()->back()->with('success', 'Pendaftaran ditolak.');
    }

    public function assignGroup(
        Request $request,
        PesertaKkn $pesertaKkn,
        RegistrationApprovalService $approvalService,
    ): RedirectResponse {
        $validated = $request->validate([
            'kelompok_id' => ['required', 'integer'],
        ]);

        $approvalService->assignGroup($pesertaKkn, $validated['kelompok_id']);

        // Notify student about group placement
        $pesertaKkn->load('mahasiswa.user', 'periode', 'kelompok.lokasi');
        $user = $pesertaKkn->mahasiswa?->user;
        if ($user && $pesertaKkn->kelompok) {
            $locationName = $pesertaKkn->kelompok->lokasi
                ? trim(($pesertaKkn->kelompok->lokasi->district_name ?? '') . ', ' . ($pesertaKkn->kelompok->lokasi->regency_name ?? ''), ', ')
                : null;

            $user->notify(new GroupPlacementConfirmedNotification(
                $pesertaKkn->kelompok->nama_kelompok,
                $pesertaKkn->periode?->name ?? 'KKN',
                $locationName ?: null,
            ));
        }

        return redirect()->back()->with('success', 'Mahasiswa berhasil ditempatkan ke kelompok.');
    }

    public function makeLeader(
        PesertaKkn $registration,
        RegistrationApprovalService $approvalService,
    ): RedirectResponse {
        // Faculty scope verification
        if (auth()->user()->hasRole('faculty_admin')) {
            $studentFacultyId = $registration->mahasiswa?->faculty_id;
            if ($studentFacultyId !== auth()->user()->faculty_id) {
                return redirect()->back()->withErrors(['error' => 'Anda hanya dapat mengubah ketua kelompok untuk mahasiswa di fakultas Anda.']);
            }
        }

        try {
            $approvalService->makeLeader($registration);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }

        return redirect()->back()->with('success', "{$registration->mahasiswa->nama} kini resmi menjadi Ketua Kelompok.");
    }
}
